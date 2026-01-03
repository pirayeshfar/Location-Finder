
import React, { useState, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Info, 
  Copy, 
  Share2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Globe,
  Home,
  Map
} from 'lucide-react';
import { Coordinates, AddressDetails, AppStatus } from './types';
import { getCurrentPosition } from './services/locationService';
import { getAddressFromCoords, getAddressFromNominatim } from './services/geminiService';
import { InfoCard } from './components/InfoCard';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<AddressDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const startLocating = useCallback(async () => {
    setStatus(AppStatus.GETTING_COORDS);
    setErrorMsg(null);
    setCoords(null);
    setAddress(null);

    try {
      const position = await getCurrentPosition();
      setCoords(position);
      
      setStatus(AppStatus.GETTING_ADDRESS);
      
      let addressData: AddressDetails;
      try {
        // Try high-accuracy Gemini grounding with Search/Maps
        addressData = await getAddressFromCoords(position);
      } catch (geminiError) {
        console.warn("Gemini service failed, falling back to Nominatim", geminiError);
        addressData = await getAddressFromNominatim(position);
      }
      
      setAddress(addressData);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      if (err.code === 1) {
        setErrorMsg("دسترسی به موقعیت مکانی رد شد. لطفاً در تنظیمات مرورگر اجازه دسترسی را فعال کنید.");
      } else {
        setErrorMsg(err.message || "خطای غیرمنتظره در دریافت موقعیت رخ داد.");
      }
    }
  }, []);

  const copyToClipboard = () => {
    if (!address) return;
    const text = `📍 موقعیت من:\n🏠 آدرس: ${address.fullAddress}\n📮 کد پستی: ${address.postcode || 'نامشخص'}\n🌐 مختصات: ${coords?.latitude}, ${coords?.longitude}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLocation = async () => {
    if (!address || !coords) return;
    const shareData = {
      title: 'موقعیت مکانی دقیق من',
      text: `آدرس: ${address.fullAddress}\nکد پستی: ${address.postcode || ''}`,
      url: `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        copyToClipboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-200">
          <MapPin size={32} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">یابنده هوشمند آدرس</h1>
        <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
          استخراج دقیق‌ترین آدرس پستی، کد پستی و جزئیات منطقه با هوش مصنوعی و داده‌های گوگل.
        </p>
      </header>

      <div className="mb-8">
        <button
          onClick={startLocating}
          disabled={status === AppStatus.GETTING_COORDS || status === AppStatus.GETTING_ADDRESS}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95 ${
            status === AppStatus.GETTING_COORDS || status === AppStatus.GETTING_ADDRESS
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {status === AppStatus.GETTING_COORDS || status === AppStatus.GETTING_ADDRESS ? (
            <RefreshCw size={24} className="animate-spin" />
          ) : (
            <Navigation size={24} />
          )}
          <span>{status === AppStatus.IDLE ? "دریافت موقعیت و آدرس دقیق" : "بروزرسانی موقعیت"}</span>
        </button>
      </div>

      {status === AppStatus.ERROR && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {(status === AppStatus.GETTING_COORDS || status === AppStatus.GETTING_ADDRESS) && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <RefreshCw size={40} className="mx-auto text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">
              {status === AppStatus.GETTING_COORDS ? "در حال دریافت مختصات از GPS..." : "در حال تحلیل آدرس و استخراج کد پستی..."}
            </p>
          </div>
        </div>
      )}

      {status === AppStatus.SUCCESS && coords && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <InfoCard title="موقعیت جغرافیایی" icon={<Navigation size={18} />}>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="block text-xs text-gray-400 mb-1 text-right">عرض جغرافیایی</span>
                <code className="text-sm font-mono text-blue-700 font-bold">{coords.latitude.toFixed(7)}</code>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-right">
                <span className="block text-xs text-gray-400 mb-1">طول جغرافیایی</span>
                <code className="text-sm font-mono text-blue-700 font-bold">{coords.longitude.toFixed(7)}</code>
              </div>
            </div>
          </InfoCard>

          {address && (
            <>
              <InfoCard title="آدرس رسمی و کامل" icon={<Globe size={18} />}>
                <p className="text-gray-800 leading-relaxed text-base font-medium">
                  {address.fullAddress}
                </p>
              </InfoCard>

              <InfoCard title="جزئیات تفکیکی منطقه" icon={<Map size={18} />}>
                <div className="space-y-3">
                  <DetailItem label="استان / شهر" value={`${address.state || '-'} / ${address.city || '-'}`} />
                  <DetailItem label="منطقه / ناحیه" value={address.district || '-'} />
                  <DetailItem label="محله" value={address.neighbourhood || '-'} />
                  <DetailItem label="خیابان اصلی" value={address.road || '-'} />
                  <DetailItem label="پلاک / واحد / ساختمان" value={address.building || '-'} icon={<Home size={14}/>} />
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-blue-500 font-bold">کد پستی ۱۰ رقمی</span>
                    <span className="text-lg font-mono text-blue-700 font-bold tracking-widest">{address.postcode || 'یافت نشد'}</span>
                  </div>
                </div>
              </InfoCard>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {copied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  <span>{copied ? "کپی شد" : "کپی آدرس"}</span>
                </button>
                <button
                  onClick={shareLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={18} />
                  <span>ارسال برای دیگران</span>
                </button>
              </div>

              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                >
                  نمایش موقعیت روی نقشه
                </a>
              </div>
            </>
          )}
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-gray-400 space-y-2 leading-relaxed">
        <p>⚠️ اطلاعات بر اساس تحلیل هوش مصنوعی و داده‌های محیطی است و ممکن است خطای جزئی داشته باشد.</p>
        <p>قدرت گرفته از Gemini 2.5 Flash & Google Search</p>
      </footer>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-700">{value}</span>
  </div>
);

export default App;
