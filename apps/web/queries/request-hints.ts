import { GeolocationService } from '@/services';
import { RequestHint } from '@repo/shared-types/types';
import { useQuery } from '@tanstack/react-query';

export const requestHintsKeys = {
  hints: () => ['requestHints'] as const,
};

const fetchRequestHints = async (): Promise<RequestHint> => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  const countryFromLocale = locale.split('-')[1]?.toUpperCase() || '';
  const timezoneParts = timezone.split('/');
  const cityFromTimezone = timezoneParts[1]?.replace(/_/g, ' ') || '';

  try {
    const data = await GeolocationService.getLocationFromIP();
    console.log('data fetched for request hints');
    return {
      timezone: data.timezone || timezone,
      city: data.city || cityFromTimezone || undefined,
      state: data.region || undefined,
      country: data.country || countryFromLocale || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Failed to fetch IP-based location:', error);

    // Try browser geolocation API as fallback
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        return {
          timezone,
          country: countryFromLocale || undefined,
          city: cityFromTimezone || undefined,
          state: undefined,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (geoError) {
        console.error('Browser geolocation failed:', geoError);
      }
    }

    // Final fallback with just timezone and derived info
    return {
      timezone,
      country: countryFromLocale || undefined,
      city: cityFromTimezone || undefined,
      state: undefined,
    };
  }
};

export function useRequestHints() {
  return useQuery({
    queryKey: requestHintsKeys.hints(),
    queryFn: fetchRequestHints,
    staleTime: Infinity, // Data doesn't change during session
    gcTime: Infinity, // Keep in cache forever during session
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
