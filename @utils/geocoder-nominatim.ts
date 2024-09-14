import { GeocoderAddress } from '@types';
import { axiosSafeRequestRepetter, Proxy } from './axios';

type NominatimAddress = {
  house_number: string;
  road: string;
  quarter: string;
  suburb: string;
  city: string;
  city_district: string;
  county: string;
  state: string;
  region: string;
  postcode: string;
  country: string;
  country_code: string;
};

export const nominatimGeocoder = async (props: {
  lat: number;
  lon: number;
  proxy?: Proxy;
  tryessec?: number[];
}): Promise<GeocoderAddress & { nominatimAddress: NominatimAddress }> => {
  const { lat, lon, proxy } = props;

  const maybeAddress = await axiosSafeRequestRepetter<{
    address: NominatimAddress;
  }>(
    {
      method: 'GET',
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      proxy,
    },
    props.tryessec ?? [0],
  );

  if ('error' in maybeAddress) {
    throw new Error(
      `Nominatim get address [${maybeAddress.error}]: ${maybeAddress.message}`,
    );
  }

  const address = maybeAddress.ok.address;

  return {
    nominatimAddress: address,
    city: address.city,
    houseNumber: Number(address.house_number) || address.house_number,
    street: address.road,
    region: address.state || address.region,
    district: address.city_district || address.county,
  };
};
