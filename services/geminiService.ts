
import { GoogleGenAI } from "@google/genai";
import { Coordinates, AddressDetails } from "../types";

export const getAddressFromCoords = async (coords: Coordinates): Promise<AddressDetails> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using Gemini 2.5 Flash for its grounding capabilities
  // Combining Google Maps and Google Search for maximum accuracy
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `به عنوان یک مامور پست دقیق، آدرس پستی کامل و دقیق مربوط به این مختصات را پیدا کن:
    عرض جغرافیایی: ${coords.latitude}
    طول جغرافیایی: ${coords.longitude}

    لطفاً اطلاعات زیر را با جستجوی دقیق استخراج کن:
    1. استان و شهر
    2. منطقه شهرداری یا بخش (District)
    3. نام محله یا شهرک
    4. نام خیابان اصلی و فرعی
    5. نام ساختمان، پلاک یا واحد (در صورت امکان)
    6. کد پستی ۱۰ رقمی (بسیار مهم)
    
    پاسخ را دقیقاً در قالب این برچسب‌ها برگردان (هر مورد در یک خط):
    استان: [نام استان]
    شهر: [نام شهر]
    منطقه: [منطقه شهرداری]
    محله: [نام محله]
    خیابان: [نام خیابان‌ها]
    پلاک/ساختمان: [جزئیات]
    کدپستی: [کد پستی]
    آدرس کامل: [آدرس روان و رسمی]`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        }
      }
    },
  });

  const text = response.text || "";
  
  // Robust parsing of the tagged response
  const getValue = (label: string) => {
    const regex = new RegExp(`${label}:\\s*(.*)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  };

  const address: AddressDetails = {
    state: getValue('استان'),
    city: getValue('شهر'),
    district: getValue('منطقه'),
    neighbourhood: getValue('محله'),
    road: getValue('خیابان'),
    building: getValue('پلاک/ساختمان'),
    postcode: getValue('کدپستی'),
    fullAddress: getValue('آدرس کامل') || text.split('\n')[0],
    formattedDisplay: text
  };

  return address;
};

export const getAddressFromNominatim = async (coords: Coordinates): Promise<AddressDetails> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=fa`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error('Nominatim request failed');
  
  const data = await response.json();
  const a = data.address || {};
  
  const road = a.road || a.residential || a.pedestrian || a.path || '';
  const neighbourhood = a.neighbourhood || a.suburb || '';
  const city = a.city || a.town || a.village || a.county || '';
  const state = a.state || '';
  const country = a.country || '';
  const postcode = a.postcode || '';

  return {
    fullAddress: data.display_name,
    road,
    neighbourhood,
    city,
    state,
    country,
    postcode,
    formattedDisplay: `${city}، ${neighbourhood}، ${road}`.replace(/،\s*،/g, '،').replace(/^،\s*|،\s*$/g, '')
  };
};
