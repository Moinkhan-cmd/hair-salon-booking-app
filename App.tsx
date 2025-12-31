import React, { useState, useEffect, useContext, createContext, useRef, useMemo } from 'react';
import { 
  Menu, X, Phone, Calendar, User as UserIcon, LogOut, 
  MapPin, Clock, Scissors, Globe, CheckCircle, Smartphone, ChevronDown, Award,
  MessageCircle, Send
} from 'lucide-react';
import { 
  User, UserRole, Appointment, Service, Barber, TimeSlot, Language 
} from './types';
import { 
  MOCK_SERVICES, MOCK_BARBERS, GENERATE_TIME_SLOTS, TRANSLATIONS, APP_NAME, checkBarberAvailability 
} from './constants';
import { Button, Input, Modal, Card } from './components/Common';
import { getSmartRecommendation, createChatSession } from './services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';

// --- 3D BACKGROUND COMPONENT ---
const Background3D = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <color attach="background" args={['#0F172A']} />
        <ambientLight intensity={0.5} />
        
        {/* Floating Golden Particles */}
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sparkles 
            count={200} 
            scale={[12, 12, 10]} 
            size={3} 
            speed={0.4} 
            opacity={0.6} 
            color="#FACC15" 
          />
        </Float>

        {/* Subtle background stars/dust */}
        <Sparkles 
          count={500} 
          scale={[20, 20, 20]} 
          size={1} 
          speed={0.1} 
          opacity={0.2} 
          color="#FFFFFF" 
        />
      </Canvas>
      {/* Overlay gradient to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-slate-900/80 pointer-events-none" />
    </div>
  );
};

// --- CONTEXT ---
interface AppContextType {
  user: User | null;
  login: (phone: string) => void;
  logout: () => void;
  appointments: Appointment[];
  addAppointment: (apt: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  updateUserPoints: (points: number) => void;
  t: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- CHAT WIDGET ---
const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
      // Add initial greeting
      setMessages([{ role: 'model', text: "Hello! I'm the Padla AI assistant. How can I help you today?" }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSessionRef.current) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text || "" }]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-80 sm:w-96 shadow-2xl mb-4 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[500px]">
          <div className="bg-gradient-to-r from-gold-500 to-gold-600 p-4 flex justify-between items-center text-slate-900 shadow-lg">
             <div className="flex items-center gap-2">
               <MessageCircle size={20} />
               <span className="font-bold">Padla AI Assistant</span>
             </div>
             <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1 rounded"><X size={18} /></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[300px] bg-slate-800/50">
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-md ${
                   m.role === 'user' 
                     ? 'bg-gold-500 text-slate-900 rounded-br-none' 
                     : 'bg-slate-700 text-white rounded-bl-none border border-slate-600'
                 }`}>
                   {m.text}
                 </div>
               </div>
             ))}
             {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-slate-700 text-slate-400 p-3 rounded-xl rounded-bl-none text-xs italic">
                   Typing...
                 </div>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-900/50 border-t border-slate-700/50 flex gap-2">
             <input 
               className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500 backdrop-blur-sm"
               placeholder="Ask about services..."
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button 
               onClick={handleSend}
               disabled={isLoading || !inputValue.trim()}
               className="bg-gold-500 text-slate-900 p-2 rounded-lg hover:bg-gold-400 disabled:opacity-50 transition-colors"
             >
               <Send size={18} />
             </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-900 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:shadow-gold-500/20"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

// --- ADMIN DASHBOARD ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { appointments, updateAppointmentStatus, t } = useApp();

  const stats = {
    totalRevenue: appointments.reduce((sum, app) => app.status !== 'CANCELLED' ? sum + app.totalPrice : sum, 0),
    count: appointments.length,
    today: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length
  };

  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 6390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-serif text-gold-500">{t.adminDashboard}</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-gold-500 bg-slate-800/80 backdrop-blur-md">
          <p className="text-slate-400">{t.totalRevenue}</p>
          <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
        </Card>
        <Card className="border-l-4 border-l-blue-500 bg-slate-800/80 backdrop-blur-md">
          <p className="text-slate-400">{t.totalAppointments}</p>
          <p className="text-2xl font-bold text-white">{stats.count}</p>
        </Card>
        <Card className="border-l-4 border-l-green-500 bg-slate-800/80 backdrop-blur-md">
          <p className="text-slate-400">Today's Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.today}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-80 bg-slate-800/80 backdrop-blur-md">
          <h3 className="text-lg font-medium text-slate-300 mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Bar dataKey="revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Recent Appointments List */}
        <Card className="h-80 overflow-y-auto bg-slate-800/80 backdrop-blur-md">
           <h3 className="text-lg font-medium text-slate-300 mb-4 sticky top-0 bg-slate-800 py-2 z-10">Recent Bookings</h3>
           <div className="space-y-3">
             {appointments.slice().reverse().map(apt => (
               <div key={apt.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                 <div>
                   <p className="font-medium text-white">{apt.userName}</p>
                   <p className="text-sm text-slate-400">{apt.date} at {apt.timeSlot}</p>
                   <p className="text-xs text-gold-500">{apt.services.map(s => s.name).join(', ')}</p>
                   <div className="flex gap-2 text-xs text-slate-500">
                      {apt.discount > 0 && <span>Disc: ₹{apt.discount}</span>}
                      {apt.pointsEarned > 0 && <span>Pts: +{apt.pointsEarned}</span>}
                   </div>
                 </div>
                 <div className="flex gap-2">
                   {apt.status === 'PENDING' && (
                     <>
                        <button onClick={() => updateAppointmentStatus(apt.id, 'CONFIRMED')} className="p-1 hover:bg-green-500/20 text-green-500 rounded"><CheckCircle size={18} /></button>
                        <button onClick={() => updateAppointmentStatus(apt.id, 'CANCELLED')} className="p-1 hover:bg-red-500/20 text-red-500 rounded"><X size={18} /></button>
                     </>
                   )}
                   {apt.status === 'CONFIRMED' && (
                      <button onClick={() => updateAppointmentStatus(apt.id, 'COMPLETED')} className="p-1 hover:bg-blue-500/20 text-blue-500 rounded text-xs px-2 border border-blue-500/50">Complete</button>
                   )}
                   <span className={`text-xs px-2 py-1 rounded ${
                     apt.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' : 
                     apt.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' : 
                     apt.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
                     'bg-yellow-500/20 text-yellow-500'
                   }`}>{apt.status}</span>
                 </div>
               </div>
             ))}
             {appointments.length === 0 && <p className="text-slate-500 text-center">No appointments yet.</p>}
           </div>
        </Card>
      </div>
    </div>
  );
};

// --- BOOKING FLOW ---
const BookingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, addAppointment, updateUserPoints, appointments, t, language } = useApp();
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState<string | null>(null);
  
  // Loyalty Logic
  const [redeemPoints, setRedeemPoints] = useState(false);
  
  const subTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const pointsAvailable = user?.loyaltyPoints || 0;
  // Rule: 1 Point = ₹1. Max redeem: lower of (total points, 50% of bill)
  const maxRedeemable = Math.min(pointsAvailable, Math.floor(subTotal * 0.5));
  const discountAmount = redeemPoints ? maxRedeemable : 0;
  const finalTotal = subTotal - discountAmount;
  const pointsToEarn = Math.floor(finalTotal * 0.05); // 5% earning rate

  useEffect(() => {
    if (user && step === 0) {
      getSmartRecommendation(user, user.visitHistory[0] || null).then(setSmartSuggestion);
    }
  }, [user, step]);

  const toggleService = (service: Service) => {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newAppointment: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest User',
        userPhone: user?.phone || 'N/A',
        services: selectedServices,
        barberId: selectedBarber?.id || null,
        date,
        timeSlot: selectedTime!,
        status: 'PENDING',
        totalPrice: finalTotal,
        discount: discountAmount,
        pointsRedeemed: discountAmount,
        pointsEarned: 0, // Points are earned when COMPLETED
        createdAt: Date.now()
      };
      
      // Deduct points immediately upon booking (simplified)
      if (redeemPoints && user) {
        updateUserPoints(-discountAmount);
      }
      
      addAppointment(newAppointment);
      setIsProcessing(false);
      onComplete();
    }, 1500);
  };

  const getServiceName = (s: Service) => {
      if (language === 'gu') return s.name_gu || s.name;
      if (language === 'hi') return s.name_hi || s.name;
      return s.name;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Progress Bar - Updated Order: Services, Time, Stylist, Confirm */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>
        {['Services', 'Time', 'Stylist', 'Confirm'].map((label, idx) => (
          <div key={idx} className={`flex flex-col items-center bg-slate-900/80 backdrop-blur px-2 ${step >= idx ? 'text-gold-500' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-1 ${step >= idx ? 'border-gold-500 bg-gold-500/10' : 'border-slate-600 bg-slate-800'}`}>
              {idx + 1}
            </div>
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 0: Services */}
        {step === 0 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {smartSuggestion && (
              <div className="bg-gradient-to-r from-gold-600/20 to-transparent p-4 rounded-lg border-l-4 border-gold-500 flex items-start gap-3 backdrop-blur-sm">
                 <div className="mt-1 bg-gold-500 text-slate-900 p-1 rounded-full"><Scissors size={14} /></div>
                 <div>
                   <h4 className="font-bold text-gold-500 text-sm">{t.smartSuggest}</h4>
                   <p className="text-sm text-slate-300 italic">"{smartSuggestion}"</p>
                 </div>
              </div>
            )}
            
            <h2 className="text-2xl font-serif text-white mb-4">{t.selectService}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_SERVICES.map(service => (
                <div 
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex gap-4 backdrop-blur-sm ${
                    selectedServices.find(s => s.id === service.id) 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                  }`}
                >
                  <img src={service.image} alt={service.name} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-white">{getServiceName(service)}</h3>
                      <span className="text-gold-500 font-bold">₹{service.price}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{service.duration} mins</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                    {service.isPopular && <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-slate-900 px-2 py-0.5 rounded-full">Popular</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Time (Swapped with Stylist) */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
             <h2 className="text-2xl font-serif text-white mb-6">{t.selectTime}</h2>
             
             {/* Date Picker (Simple) */}
             <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {[...Array(7)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dStr = d.toISOString().split('T')[0];
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = d.getDate();
                  
                  return (
                    <button
                      key={i}
                      onClick={() => { setDate(dStr); setSelectedTime(null); setSelectedBarber(null); }}
                      className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl border transition-all backdrop-blur-sm ${
                        date === dStr 
                          ? 'bg-gold-500 text-slate-900 border-gold-500 shadow-lg shadow-gold-500/20' 
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-xs uppercase font-bold">{dayName}</span>
                      <span className="text-2xl font-serif font-bold">{dayNum}</span>
                    </button>
                  )
                })}
             </div>

             {/* Time Slots */}
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {GENERATE_TIME_SLOTS().map((slot, i) => (
                  <button
                    key={i}
                    disabled={!slot.available}
                    onClick={() => { setSelectedTime(slot.time); setSelectedBarber(null); }}
                    className={`py-2 px-1 text-sm rounded-lg border text-center transition-all backdrop-blur-sm ${
                      selectedTime === slot.time
                        ? 'bg-white text-slate-900 border-white font-bold shadow-lg'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* Step 2: Stylist (Swapped with Time, and includes availability check) */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
             <h2 className="text-2xl font-serif text-white mb-6">{t.selectBarber}</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div 
                 onClick={() => setSelectedBarber(null)}
                 className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center justify-center h-48 transition-all backdrop-blur-sm ${
                   selectedBarber === null
                     ? 'border-gold-500 bg-gold-500/10'
                     : 'border-slate-700 bg-slate-800/60'
                 }`}
               >
                 <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                   <Scissors className="text-slate-400" />
                 </div>
                 <p className="font-medium text-white">Any Professional</p>
                 <p className="text-xs text-slate-500">First Available</p>
               </div>
               
               {MOCK_BARBERS.map(barber => {
                 // CHECK AVAILABILITY
                 const isBooked = selectedTime ? !checkBarberAvailability(barber.id, date, selectedTime, appointments) : false;
                 const isUnavailable = !barber.isAvailable || isBooked;

                 if (isUnavailable) return null; // "Show only available barbers"

                 return (
                   <div 
                     key={barber.id}
                     onClick={() => setSelectedBarber(barber)}
                     className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center h-48 transition-all relative backdrop-blur-sm ${
                       selectedBarber?.id === barber.id
                         ? 'border-gold-500 bg-gold-500/10'
                         : 'border-slate-700 bg-slate-800/60'
                     }`}
                   >
                     <img src={barber.image} alt={barber.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-slate-600" />
                     <p className="font-medium text-white text-center text-sm">{barber.name}</p>
                     <p className="text-xs text-gold-500">{barber.specialization}</p>
                     <div className="absolute top-2 right-2 flex items-center bg-black/50 rounded px-1.5">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs text-white ml-1">{barber.rating}</span>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* Step 3: Confirm - NEW STYLISH DESIGN */}
        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-300 max-w-lg mx-auto">
            <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-gold-500/30 shadow-2xl relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Scissors size={100} className="text-gold-500" />
              </div>
              
              <h2 className="text-3xl font-serif text-white mb-6 text-center">Booking Summary</h2>

              <div className="space-y-6 relative z-10">
                 {/* Date & Time Block */}
                 <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center shrink-0">
                       <Calendar size={24} />
                    </div>
                    <div>
                       <p className="text-slate-400 text-sm">Date & Time</p>
                       <p className="text-white font-bold text-lg">{date} at {selectedTime}</p>
                    </div>
                 </div>

                 {/* Barber Block */}
                 <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                       <UserIcon size={24} />
                    </div>
                    <div>
                       <p className="text-slate-400 text-sm">Stylist</p>
                       <p className="text-white font-bold text-lg">{selectedBarber?.name || "Any Professional"}</p>
                    </div>
                 </div>

                 {/* Services List */}
                 <div className="bg-slate-700/30 p-4 rounded-xl border border-white/5">
                    <p className="text-slate-400 text-sm mb-3">Selected Services</p>
                    <div className="space-y-3">
                       {selectedServices.map(s => (
                         <div key={s.id} className="flex justify-between items-center text-sm">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div>
                             <span className="text-slate-200">{getServiceName(s)}</span>
                           </div>
                           <span className="text-slate-300 font-mono">₹{s.price}</span>
                         </div>
                       ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-slate-400 text-xs uppercase tracking-wide">Total Duration</span>
                        <span className="text-white">{selectedServices.reduce((acc, s) => acc + s.duration, 0)} mins</span>
                    </div>
                 </div>

                 {/* Loyalty Section */}
                 {user && user.role !== UserRole.GUEST && (
                   <div className="bg-gradient-to-r from-gold-500/10 to-transparent p-4 rounded-xl border border-gold-500/20">
                     <div className="flex justify-between items-center mb-3">
                       <span className="flex items-center text-gold-400 text-sm gap-2 font-bold">
                         <Award size={16} /> {t.availablePoints}
                       </span>
                       <span className="font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded text-sm">{pointsAvailable}</span>
                     </div>
                     
                     {pointsAvailable > 0 ? (
                        <div className="flex items-center gap-3">
                           <input 
                             type="checkbox" 
                             id="redeemPoints"
                             checked={redeemPoints}
                             onChange={(e) => setRedeemPoints(e.target.checked)}
                             className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500 bg-slate-800 border-slate-600 accent-gold-500"
                           />
                           <label htmlFor="redeemPoints" className="text-sm text-slate-300 cursor-pointer select-none">
                             {t.redeemPoints} <span className="text-slate-500">(Max ₹{maxRedeemable})</span>
                           </label>
                        </div>
                     ) : (
                       <p className="text-xs text-slate-500 italic">{t.insufficientPoints}</p>
                     )}
                   </div>
                 )}

                 {/* Final Totals */}
                 <div className="space-y-2 pt-4 border-t border-slate-600/50">
                    <div className="flex justify-between text-slate-400">
                       <span>Subtotal</span>
                       <span>₹{subTotal}</span>
                    </div>
                    {redeemPoints && (
                       <div className="flex justify-between text-green-400">
                          <span>Loyalty Discount</span>
                          <span>-₹{discountAmount}</span>
                       </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                       <span className="text-xl font-serif text-white">{t.payOnly}</span>
                       <span className="text-3xl font-bold text-gold-500">₹{finalTotal}</span>
                    </div>
                    {user && (
                      <div className="text-right text-xs text-gold-600 mt-1">
                        {t.earnPoints}: +{pointsToEarn} pts
                      </div>
                    )}
                 </div>
              </div>

              <Button fullWidth onClick={handleConfirm} isLoading={isProcessing} className="mt-8 py-4 text-lg shadow-gold-500/20 shadow-lg">
                  {t.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button 
          variant="secondary" 
          onClick={() => setStep(s => s - 1)} 
          disabled={step === 0 || isProcessing}
          className={step === 0 ? 'invisible' : ''}
        >
          Back
        </Button>
        {step < 3 && (
          <Button 
            onClick={() => setStep(s => s + 1)} 
            disabled={
              (step === 0 && selectedServices.length === 0) ||
              (step === 1 && !selectedTime) // Step 1 is now Time
              // Step 2 (Stylist) is optional ("Any Professional" is valid if null)
            }
          >
            {step === 2 ? 'Review Booking' : 'Next Step'}
          </Button>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const MainApp: React.FC = () => {
  // Mock Database
  const [users, setUsers] = useState<User[]>([
    { 
        id: 'u1', 
        name: 'Rahul Varma', 
        phone: '9876543210', 
        role: UserRole.CUSTOMER, 
        loyaltyPoints: 120,
        visitHistory: [{ id: 'prev1', userId: 'u1', userName: 'Rahul', userPhone: '...', services: [MOCK_SERVICES[0]], barberId: 'b1', date: '2023-10-01', timeSlot: '10:00', status: 'COMPLETED', totalPrice: 300, discount: 0, pointsRedeemed: 0, pointsEarned: 15, createdAt: 0 }] 
    },
    { 
        id: 'admin', 
        name: 'Padla Admin', 
        phone: '9998887776', 
        role: UserRole.ADMIN, 
        loyaltyPoints: 0, 
        visitHistory: [] 
    }
  ]);

  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<'home' | 'booking' | 'admin' | 'profile' | 'success'>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const t = TRANSLATIONS[language];

  // Auth Functions
  const handleLogin = () => {
    // Simple mock auth against users array
    const existingUser = users.find(u => u.phone === phoneInput);
    
    if (existingUser) {
      setUser(existingUser);
    } else {
      // Create new user
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Customer',
        phone: phoneInput,
        role: UserRole.CUSTOMER,
        loyaltyPoints: 0,
        visitHistory: []
      };
      setUsers(prev => [...prev, newUser]);
      setUser(newUser);
    }
    
    setShowLogin(false);
    setOtpSent(false);
    setPhoneInput('');
    setOtpInput('');
  };

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
  };

  const updateUserPoints = (pointsDelta: number) => {
    if (!user) return;
    const newTotal = user.loyaltyPoints + pointsDelta;
    
    // Update local session
    setUser({ ...user, loyaltyPoints: newTotal });
    
    // Update "Database"
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, loyaltyPoints: newTotal } : u));
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => {
      return prev.map(a => {
        if (a.id === id) {
           // If moving to completed, award points
           if (status === 'COMPLETED' && a.status !== 'COMPLETED') {
             const pointsEarned = Math.floor(a.totalPrice * 0.05);
             // We need to update the user in the "database"
             const updatedA = { ...a, status, pointsEarned };
             
             // Update user points in the "database"
             setTimeout(() => {
               setUsers(currentUsers => currentUsers.map(u => 
                 u.id === a.userId ? { ...u, loyaltyPoints: u.loyaltyPoints + pointsEarned } : u
               ));
               
               // If the user being updated is currently logged in, update them too
               if (user && user.id === a.userId) {
                  setUser(curr => curr ? { ...curr, loyaltyPoints: curr.loyaltyPoints + pointsEarned } : null);
               }
             }, 0);
             
             return updatedA;
           }
           return { ...a, status };
        }
        return a;
      });
    });
  };

  const contextValue = {
    user,
    login: (phone: string) => { setPhoneInput(phone); handleLogin(); }, 
    logout: () => { setUser(null); setView('home'); },
    appointments,
    addAppointment,
    updateAppointmentStatus,
    language,
    setLanguage,
    updateUserPoints,
    t
  };

  return (
    <AppContext.Provider value={contextValue}>
      <Background3D />
      <div className="min-h-screen flex flex-col font-sans selection:bg-gold-500 selection:text-slate-900 relative" onClick={() => setLangOpen(false)}>
        
        {/* NEW FLOATING NAVBAR */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 transition-all duration-300 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between w-full max-w-5xl relative overflow-hidden group">
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] animate-shine pointer-events-none" />

            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group/logo" 
              onClick={() => setView('home')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-slate-900 font-bold font-serif text-xl shadow-lg group-hover/logo:scale-105 transition-transform">P</div>
              <h1 className="text-xl font-serif text-white tracking-wide group-hover/logo:text-gold-400 transition-colors hidden sm:block">{APP_NAME}</h1>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-2">
                <button 
                  onClick={() => setView('home')} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    view === 'home' 
                      ? 'bg-white/10 text-gold-400 shadow-inner' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </button>
                {user?.role === UserRole.ADMIN && (
                  <button 
                    onClick={() => setView('admin')} 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      view === 'admin' 
                        ? 'bg-white/10 text-gold-400 shadow-inner' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.adminDashboard}
                  </button>
                )}
                {user && (
                   <button 
                   onClick={() => setView('profile')} 
                   className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                     view === 'profile' 
                       ? 'bg-white/10 text-gold-400 shadow-inner' 
                       : 'text-slate-300 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   My Profile
                 </button>
                )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
               {/* Language Dropdown */}
               <div className="relative" onClick={(e) => e.stopPropagation()}>
                 <button 
                   onClick={() => setLangOpen(!langOpen)}
                   className="flex items-center gap-2 text-slate-300 hover:text-white text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors hover:border-gold-500/50"
                 >
                   <Globe size={14} />
                   <span className="uppercase hidden xs:inline">{language}</span>
                   <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {langOpen && (
                   <div className="absolute top-full right-0 mt-2 w-32 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 backdrop-blur-md">
                     {(['en', 'gu', 'hi'] as Language[]).map(l => (
                       <button 
                         key={l}
                         onClick={() => { setLanguage(l); setLangOpen(false); }}
                         className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex justify-between items-center ${language === l ? 'text-gold-500 font-medium' : 'text-slate-300'}`}
                       >
                         {l === 'en' ? 'English' : l === 'gu' ? 'ગુજરાતી' : 'हिंदी'}
                         {language === l && <CheckCircle size={12} />}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden lg:block text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.welcome}</p>
                    <p className="text-sm font-medium text-white leading-none">{user.name.split(' ')[0]}</p>
                  </div>
                  <Button variant="outline" className="p-2 rounded-full w-9 h-9 flex items-center justify-center border-slate-600 text-slate-400 hover:text-white hover:border-white" onClick={() => contextValue.logout()}>
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowLogin(true)} className="gap-2 rounded-full px-5 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all">
                  <UserIcon size={16} />
                  <span className="hidden sm:inline">{t.login}</span>
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 container mx-auto px-4 pt-32 pb-6 relative z-10">
          
          {/* HOME VIEW */}
          {view === 'home' && (
            <div className="space-y-16">
              {/* Hero */}
              <section className="relative rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center text-center px-4 group perspective-1000">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                  <img 
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80" 
                    alt="Salon Background" 
                    className="w-full h-full object-cover opacity-40 mask-image-gradient"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                </div>
                
                <div className="relative z-10 max-w-3xl space-y-6 animate-in slide-in-from-bottom-10 duration-700">
                   <h1 className="text-4xl md:text-7xl font-serif text-white leading-tight drop-shadow-2xl">
                     {t.welcome} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic block py-2">{APP_NAME}</span>
                   </h1>
                   <p className="text-lg md:text-xl text-slate-200 font-light max-w-2xl mx-auto">
                     Experience premium grooming services tailored for the modern gentleman, enhanced by AI precision.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                     <Button 
                        className="h-14 px-8 text-lg rounded-full shadow-lg shadow-gold-500/20 hover:scale-105 transition-transform" 
                        onClick={() => setView('booking')}
                      >
                       {t.bookNow}
                     </Button>
                     <Button 
                       variant="outline" 
                       className="h-14 px-8 text-lg rounded-full border-2 hover:bg-white/5 backdrop-blur-sm"
                       onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})}
                     >
                       {t.services}
                     </Button>
                   </div>
                </div>
              </section>

              {/* Features / Quick Info */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Clock, title: "Smart Booking", desc: "AI-powered slots & easy scheduling." },
                  { icon: Scissors, title: "Expert Stylists", desc: "Masters of modern and classic cuts." },
                  { icon: MapPin, title: "Prime Location", desc: "Center of the city, ample parking." },
                ].map((f, i) => (
                  <Card key={i} className="flex flex-col items-center text-center p-8 bg-slate-800/40 backdrop-blur-md border border-white/5 hover:border-gold-500/50 transition-colors group">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center text-gold-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <f.icon size={28} />
                    </div>
                    <h3 className="text-xl font-serif text-white mb-3">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </Card>
                ))}
              </section>
            </div>
          )}

          {/* BOOKING VIEW */}
          {view === 'booking' && (
            <BookingWizard onComplete={() => setView('success')} />
          )}

          {/* SUCCESS VIEW */}
          {view === 'success' && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center animate-in zoom-in duration-300">
               <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/10">
                 <CheckCircle size={48} />
               </div>
               <h2 className="text-4xl font-serif text-white mb-4">Booking Confirmed!</h2>
               <p className="text-slate-400 mb-8 max-w-md text-lg">
                 We've sent a confirmation SMS to your phone. We look forward to seeing you at Padla Hair Salon.
               </p>
               <div className="flex gap-4">
                 <Button onClick={() => setView('home')} className="rounded-full px-8">Back to Home</Button>
                 <Button variant="outline" onClick={() => setView('profile')} className="rounded-full px-8">View My Bookings</Button>
               </div>
            </div>
          )}

          {/* ADMIN VIEW */}
          {view === 'admin' && (
             user?.role === UserRole.ADMIN ? <AdminDashboard /> : <div className="text-center text-red-500 mt-20">Access Denied</div>
          )}

          {/* PROFILE VIEW */}
          {view === 'profile' && user && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-6 mb-8 bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-3xl font-bold text-slate-900 shadow-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-serif text-white">{user.name}</h2>
                  <p className="text-slate-400">{user.phone}</p>
                  <p className="text-gold-500 text-sm mt-2 flex items-center gap-2 font-medium bg-gold-500/10 px-3 py-1 rounded-full w-fit">
                    <Award size={14} /> {t.loyaltyPoints}: {user.loyaltyPoints}
                  </p>
                </div>
              </div>

              <h3 className="text-xl text-white border-b border-slate-700 pb-2 font-serif">{t.history}</h3>
              <div className="space-y-4">
                {[...user.visitHistory, ...appointments.filter(a => a.userId === user.id)].reverse().map((apt, i) => (
                   <Card key={i} className="flex justify-between items-center bg-slate-800/40 backdrop-blur-sm border-white/5">
                      <div>
                        <p className="font-medium text-white text-lg">{apt.date}</p>
                        <p className="text-slate-500 text-sm flex items-center gap-2"><Clock size={12}/> {apt.timeSlot}</p>
                        <p className="text-sm text-gold-500/80 mt-1">{apt.services.map(s => s.name).join(', ')}</p>
                      </div>
                      <div className="text-right">
                         <span className={`text-xs px-3 py-1 rounded-full font-medium block mb-2 ${
                            apt.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' :
                            apt.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-slate-700 text-slate-300'
                         }`}>{apt.status}</span>
                         <span className="text-lg font-bold text-white">₹{apt.totalPrice}</span>
                      </div>
                   </Card>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* CHAT WIDGET */}
        <ChatWidget />

        {/* FOOTER */}
        <footer className="bg-slate-950/80 border-t border-slate-900 py-12 relative z-10 backdrop-blur-lg">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="text-center md:text-left">
               <h3 className="text-gold-500 font-serif font-bold text-2xl mb-2">{APP_NAME}</h3>
               <p className="text-slate-500 text-sm max-w-xs">Premium styling and grooming services tailored for the modern gentleman since 2024.</p>
             </div>
             
             <div className="flex gap-4">
               <Button variant="outline" className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-slate-800 hover:border-gold-500 hover:bg-gold-500 hover:text-slate-900 transition-all">
                 <Phone size={20} />
               </Button>
               <Button variant="outline" className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-slate-800 hover:border-gold-500 hover:bg-gold-500 hover:text-slate-900 transition-all">
                 <MapPin size={20} />
               </Button>
               <Button variant="outline" className="rounded-full w-12 h-12 p-0 flex items-center justify-center border-slate-800 hover:border-gold-500 hover:bg-gold-500 hover:text-slate-900 transition-all">
                 <Globe size={20} />
               </Button>
             </div>
          </div>
          <div className="text-center text-slate-700 text-xs mt-8">
            © 2024 {APP_NAME}. All rights reserved.
          </div>
        </footer>

        {/* LOGIN MODAL */}
        <Modal isOpen={showLogin} onClose={() => setShowLogin(false)} title={otpSent ? t.verify : t.login}>
          {!otpSent ? (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Enter your phone number to access your appointments and rewards.</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">+91</span>
                <Input 
                  placeholder="98765 43210" 
                  className="pl-12" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </div>
              <Button fullWidth onClick={() => { if(phoneInput) setOtpSent(true); }}>{t.login}</Button>
              <div className="text-center">
                 <span className="text-xs text-slate-500">Or continue as </span>
                 <button onClick={() => { setShowLogin(false); setView('booking'); }} className="text-xs text-gold-500 hover:underline">Guest</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Enter the 4-digit code sent to +91 {phoneInput}</p>
              <Input 
                placeholder="0000" 
                className="text-center tracking-[0.5em] font-mono text-lg" 
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
              />
              <Button fullWidth onClick={handleLogin}>{t.verify}</Button>
              <button onClick={() => setOtpSent(false)} className="w-full text-center text-xs text-slate-500 hover:text-white mt-2">Change Number</button>
            </div>
          )}
        </Modal>

      </div>
    </AppContext.Provider>
  );
};

export default MainApp;