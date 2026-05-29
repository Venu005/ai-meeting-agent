import { Injectable, NotFoundException } from '@nestjs/common';
import 'multer';
import {
  convertToModelMessages,
  createUIMessageStream,
  experimental_transcribe as transcribe,
  generateText,
  pipeUIMessageStreamToResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { fallbackPrompts } from 'src/agents/prompts';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { GetChatsQueryDto, MessageDto, UpdateChatDto } from '../dto/chat-agent.dto';
import { convertToUIMessages } from '../dto/db-message.dto';
import { InputJsonValue } from '@repo/db/generated/prisma/runtime/library';
import { RequestHint } from '@repo/shared-types/types';
import { UserProfile } from '@repo/db';
import { getMemoryProtocolPrompt, getTemporalContextPrompt, getToolsPrompt } from '../prompts/dynamic-prompts';
import { ToolsService } from '../tools.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly toolsService: ToolsService
  ) {}

  async createTranscript(file: Express.Multer.File) {
    try {
      const transcript = await transcribe({
        model: openai.transcription('whisper-1'),
        audio: file.buffer,
      });
      return transcript.text;
    } catch {
      throw new Error('Error transcribing audio');
    }
  }

  private constructSystemPrompt({
    userProfile,
    user,
    requestHints,
  }: {
    userProfile?: UserProfile | null;
    user?: RequestUser;
    requestHints?: RequestHint;
  }) {
    let systemPrompt = fallbackPrompts.getChatAgentPrompt();
    const temporalContextPrompt = getTemporalContextPrompt(requestHints);
    const memoryProtocolPrompt = getMemoryProtocolPrompt();
    const toolsPrompt = getToolsPrompt();

    systemPrompt += memoryProtocolPrompt + toolsPrompt + temporalContextPrompt;

    if (userProfile) {
      const { dob, gender, address, city, state, country } = userProfile;
      const userInfoParts: string[] = [];

      if (user?.name) userInfoParts.push(`Name: ${user.name}`);
      if (gender) userInfoParts.push(`Gender: ${gender}`);
      if (dob) userInfoParts.push(`Date of Birth: ${dob.toISOString()}`);
      if (address) userInfoParts.push(`Address: ${address}`);
      if (city) userInfoParts.push(`City: ${city}`);
      if (state) userInfoParts.push(`State: ${state}`);
      if (country) userInfoParts.push(`Country: ${country}`);

      if (userInfoParts.length > 0) {
        systemPrompt += `\n\n### User Profile Information\n${userInfoParts.join('\n')}`;
      }
    }
    return systemPrompt;
  }

  async createChat(userId: string) {
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        userId,
      },
      include: {
        chatMessages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (existingChat && existingChat.chatMessages.length === 0) {
      return existingChat;
    }
    return await this.prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          userId,
        },
      });
      return chat;
    });
  }

  async chat(chatId: string, message: MessageDto, user: RequestUser, res: Response, requestHints?: RequestHint) {
    const [chat, userProfile] = await Promise.all([
      this.getChatWithMessages(user.id, chatId),
      this.prisma.userProfile.findUnique({
        where: {
          userId: user.id,
        },
      }),
    ]);

    if (chat.userId !== user.id) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.chatMessages.length === 0 && chat.title === 'New Chat') {
      await this.generateAndChangeTitle(message, chatId);
    }

    const uiMessages = [...convertToUIMessages(chat.chatMessages), message];

    await this.prisma.chatMessage.create({
      data: {
        chatId,
        role: message.role,
        parts: message.parts,
        attachments: message.attachments,
      },
    });

    const model = openai('gpt-5.1');

    const systemPrompt = this.constructSystemPrompt({ userProfile, user, requestHints });

    pipeUIMessageStreamToResponse({
      response: res,
      stream: createUIMessageStream({
        execute: ({ writer }) => {
          const result = streamText({
            model: model,
            system: systemPrompt,
            messages: convertToModelMessages(uiMessages),
            stopWhen: stepCountIs(10),
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              ...this.toolsService.getTools(),
            },
            temperature: 0.6,
            onStepFinish: ({ finishReason }) => {
              console.log(finishReason);
            },
            onFinish: ({ usage }) => {
              try {
                const tokenData = {
                  totalTokens: usage.totalTokens || 0,
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                  cachedTokens: usage.cachedInputTokens || 0,
                };

                console.log('Token data', tokenData);
              } catch (error) {
                console.error('Error saving token stats:', error);
              }
            },
          });

          writer.merge(result.toUIMessageStream());
        },
        onFinish: async (response) => {
          const lastMessage = response.messages[response.messages.length - 1];
          await this.prisma.chatMessage.create({
            data: {
              chatId,
              role: lastMessage.role,
              parts: lastMessage.parts as InputJsonValue,
            },
          });
        },
        onError: (error) => {
          console.log(error);
          return error instanceof Error ? error.message : String(error);
        },
      }),
    });
  }

  async getChatWithMessages(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: {
        id: chatId,
        userId,
      },
      include: {
        chatMessages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async getChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (chat.userId !== userId && !chat.isPublic) {
      throw new NotFoundException('Chat not found');
    }
    return chat;
  }

  async getChats(userId: string, query: GetChatsQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: { userId },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.chat.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      chats,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async updateChat(userId: string, chatId: string, body: UpdateChatDto) {
    const existingChat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!existingChat || existingChat.userId !== userId) {
      throw new NotFoundException('Chat not found');
    }

    const chat = await this.prisma.chat.update({
      where: { id: chatId, userId },
      data: body,
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return { message: 'Chat updated successfully' };
  }

  async deleteChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.delete({
      where: { id: chatId, userId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return { message: 'Chat deleted successfully' };
  }

  async getPublicChatsForUser(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { userId, isPublic: true },
    });
    return chats;
  }

  private async generateAndChangeTitle(userMessage: UIMessage, chatId: string) {
    const { text: title } = await generateText({
      model: openai('gpt-4o-mini'),
      system: `\n
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long (around 3-4 words only)
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(userMessage),
    });

    if (title) {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { title },
      });
    }
  }
}
