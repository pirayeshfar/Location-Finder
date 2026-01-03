
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AddressDetails {
  fullAddress: string;
  road?: string;
  neighbourhood?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  building?: string;
  formattedDisplay: string;
}

export enum AppStatus {
  IDLE = 'idle',
  GETTING_COORDS = 'getting_coords',
  GETTING_ADDRESS = 'getting_address',
  SUCCESS = 'success',
  ERROR = 'error'
}
