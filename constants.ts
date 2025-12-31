import { Barber, Service, TimeSlot } from './types';

export const APP_NAME = "Padla Hair Salon";

export const MOCK_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Classic Haircut',
    name_gu: 'ક્લાસિક હેરકટ',
    name_hi: 'क्लासिक हेयरकट',
    price: 300,
    duration: 30,
    description: 'Precision cut with styling and wash.',
    image: 'https://picsum.photos/200/200?random=1',
    category: 'hair',
    isPopular: true
  },
  {
    id: 's2',
    name: 'Beard Trim & Shape',
    name_gu: 'દાઢી ટ્રીમ',
    name_hi: 'बियर्ड ट्रिम',
    price: 150,
    duration: 20,
    description: 'Professional beard sculpting with razor finish.',
    image: 'https://picsum.photos/200/200?random=2',
    category: 'beard'
  },
  {
    id: 's3',
    name: 'Royal Shave',
    name_gu: 'રોયલ શેવ',
    name_hi: 'रॉयल शेव',
    price: 200,
    duration: 25,
    description: 'Hot towel shave with premium oils.',
    image: 'https://picsum.photos/200/200?random=3',
    category: 'beard'
  },
  {
    id: 's4',
    name: 'Gold Facial',
    name_gu: 'ગોલ્ડ ફેશિયલ',
    name_hi: 'गोल्ड फेशियल',
    price: 800,
    duration: 45,
    description: 'Deep cleansing and rejuvenating facial treatment.',
    image: 'https://picsum.photos/200/200?random=4',
    category: 'face'
  },
  {
    id: 's5',
    name: 'Groom Package (Cut + Beard + Facial)',
    name_gu: 'ગ્રૂમ પેકેજ',
    name_hi: 'ग्रूम पैकेज',
    price: 1100,
    duration: 90,
    description: 'Complete makeover package for men.',
    image: 'https://picsum.photos/200/200?random=5',
    category: 'combo',
    isPopular: true
  }
];

export const MOCK_BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Rajesh Kumar',
    specialization: 'Senior Stylist',
    experience: '8 Years',
    image: 'https://picsum.photos/150/150?random=10',
    isAvailable: true,
    rating: 4.8
  },
  {
    id: 'b2',
    name: 'Vikram Singh',
    specialization: 'Beard Expert',
    experience: '5 Years',
    image: 'https://picsum.photos/150/150?random=11',
    isAvailable: true,
    rating: 4.6
  },
  {
    id: 'b3',
    name: 'Amit Patel',
    specialization: 'Colorist',
    experience: '6 Years',
    image: 'https://picsum.photos/150/150?random=12',
    isAvailable: false, // On leave
    rating: 4.9
  }
];

export const GENERATE_TIME_SLOTS = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 10; // 10 AM
  const endHour = 20; // 8 PM
  
  for (let i = startHour; i < endHour; i++) {
    slots.push({ time: `${i}:00`, available: true });
    slots.push({ time: `${i}:30`, available: true });
  }
  return slots;
};

export const TRANSLATIONS = {
  en: {
    welcome: "Welcome to",
    bookNow: "Book Appointment",
    services: "Our Services",
    barbers: "Our Stylists",
    selectService: "Select Services",
    selectBarber: "Choose Professional",
    selectTime: "Select Date & Time",
    confirm: "Confirm Booking",
    login: "Login",
    phonePlaceholder: "Enter Phone Number",
    otpPlaceholder: "Enter OTP",
    verify: "Verify & Login",
    resend: "Resend OTP",
    adminDashboard: "Admin Dashboard",
    totalRevenue: "Total Revenue",
    totalAppointments: "Total Appointments",
    upcoming: "Upcoming",
    history: "History",
    logout: "Logout",
    guestMode: "Continue as Guest",
    smartSuggest: "AI Suggestion",
    loyaltyPoints: "Loyalty Points",
    redeemPoints: "Redeem Points",
    availablePoints: "Available Points",
    discount: "Discount",
    earnPoints: "You will earn",
    payOnly: "Pay Only",
    insufficientPoints: "Insufficient points"
  },
  gu: {
    welcome: "સ્વાગત છે",
    bookNow: "બુકિંગ કરો",
    services: "અમારી સેવાઓ",
    barbers: "અમારા સ્ટાઈલિસ્ટ",
    selectService: "સેવા પસંદ કરો",
    selectBarber: "વાળંદ પસંદ કરો",
    selectTime: "તારીખ અને સમય",
    confirm: "બુકિંગ પુષ્ટિ કરો",
    login: "લોગ ઇન કરો",
    phonePlaceholder: "ફોન નંબર દાખલ કરો",
    otpPlaceholder: "OTP દાખલ કરો",
    verify: "ચકાસો અને લોગ ઇન કરો",
    resend: "ફરીથી મોકલો",
    adminDashboard: "એડમિન ડેશબોર્ડ",
    totalRevenue: "કુલ આવક",
    totalAppointments: "કુલ મુલાકાતો",
    upcoming: "આગામી",
    history: "ઇતિહાસ",
    logout: "લોગ આઉટ",
    guestMode: "ગેસ્ટ તરીકે ચાલુ રાખો",
    smartSuggest: "AI સલાહ",
    loyaltyPoints: "લોયલ્ટી પોઈન્ટ્સ",
    redeemPoints: "પોઈન્ટ્સ વાપરો",
    availablePoints: "ઉપલબ્ધ પોઈન્ટ્સ",
    discount: "ડિસ્કાઉન્ટ",
    earnPoints: "તમે મેળવશો",
    payOnly: "ચૂકવવા પાત્ર",
    insufficientPoints: "અપૂરતા પોઈન્ટ્સ"
  },
  hi: {
    welcome: "स्वागत है",
    bookNow: "अपॉइंटमेंट बुक करें",
    services: "हमारी सेवाएं",
    barbers: "हमारे स्टाइलिस्ट",
    selectService: "सेवाएं चुनें",
    selectBarber: "स्टाइलिस्ट चुनें",
    selectTime: "दिनांक और समय चुनें",
    confirm: "बुकिंग की पुष्टि करें",
    login: "लॉग इन करें",
    phonePlaceholder: "फ़ोन नंबर दर्ज करें",
    otpPlaceholder: "ओटीपी दर्ज करें",
    verify: "सत्यापित करें और लॉगिन करें",
    resend: "पुनः भेजें",
    adminDashboard: "एडमिन डैशबोर्ड",
    totalRevenue: "कुल राजस्व",
    totalAppointments: "कुल अपॉइंटमेंट",
    upcoming: "आगामी",
    history: "इतिहास",
    logout: "लॉग आउट",
    guestMode: "अतिथि के रूप में जारी रखें",
    smartSuggest: "AI सुझाव",
    loyaltyPoints: "लॉयल्टी पॉइंट्स",
    redeemPoints: "पॉइंट्स रिडीम करें",
    availablePoints: "उपलब्ध पॉइंट्स",
    discount: "छूट",
    earnPoints: "आप अर्जित करेंगे",
    payOnly: "भुगतान राशि",
    insufficientPoints: "अपर्याप्त अंक"
  }
};
