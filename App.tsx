import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  Menu, X, Phone, Calendar, User as UserIcon, LogOut, 
  MapPin, Clock, Scissors, Globe, CheckCircle, Smartphone, ChevronDown, Award 
} from 'lucide-react';
import { 
  User, UserRole, Appointment, Service, Barber, TimeSlot, Language 
} from './types';
import { 
  MOCK_SERVICES, MOCK_BARBERS, GENERATE_TIME_SLOTS, TRANSLATIONS, APP_NAME 
} from './constants';
import { Button, Input, Modal, Card } from './components/Common';
import { getSmartRecommendation } from './services/geminiService';
// We will implement pages in this file to ensure context availability without complex exports
// In a real app, these would be separate files

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
        <Card className="border-l-4 border-l-gold-500">
          <p className="text-slate-400">{t.totalRevenue}</p>
          <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <p className="text-slate-400">{t.totalAppointments}</p>
          <p className="text-2xl font-bold text-white">{stats.count}</p>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <p className="text-slate-400">Today's Bookings</p>
          <p className="text-2xl font-bold text-white">{stats.today}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-80">
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
        <Card className="h-80 overflow-y-auto">
           <h3 className="text-lg font-medium text-slate-300 mb-4 sticky top-0 bg-slate-800 py-2">Recent Bookings</h3>
           <div className="space-y-3">
             {appointments.slice().reverse().map(apt => (
               <div key={apt.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
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
  const { user, addAppointment, updateUserPoints, t, language } = useApp();
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
      {/* Progress Bar */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>
        {['Services', 'Stylist', 'Time', 'Confirm'].map((label, idx) => (
          <div key={idx} className={`flex flex-col items-center bg-slate-900 px-2 ${step >= idx ? 'text-gold-500' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-1 ${step >= idx ? 'border-gold-500 bg-gold-500/10' : 'border-slate-600 bg-slate-800'}`}>
              {idx + 1}
            </div>
            <span className="text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {smartSuggestion && (
              <div className="bg-gradient-to-r from-gold-600/20 to-transparent p-4 rounded-lg border-l-4 border-gold-500 flex items-start gap-3">
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
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex gap-4 ${
                    selectedServices.find(s => s.id === service.id) 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-slate-700 bg-slate-800 hover:border-slate-500'
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

        {step === 1 && (
          <div className="animate-in slide-in-from-right-8 duration-300">
             <h2 className="text-2xl font-serif text-white mb-6">{t.selectBarber}</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div 
                 onClick={() => setSelectedBarber(null)}
                 className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center justify-center h-48 transition-all ${
                   selectedBarber === null
                     ? 'border-gold-500 bg-gold-500/10'
                     : 'border-slate-700 bg-slate-800'
                 }`}
               >
                 <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                   <Scissors className="text-slate-400" />
                 </div>
                 <p className="font-medium text-white">Any Professional</p>
                 <p className="text-xs text-slate-500">First Available</p>
               </div>
               
               {MOCK_BARBERS.map(barber => (
                 <div 
                   key={barber.id}
                   onClick={() => barber.isAvailable && setSelectedBarber(barber)}
                   className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center h-48 transition-all relative ${
                     selectedBarber?.id === barber.id
                       ? 'border-gold-500 bg-gold-500/10'
                       : 'border-slate-700 bg-slate-800'
                   } ${!barber.isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                 >
                   <img src={barber.image} alt={barber.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-slate-600" />
                   <p className="font-medium text-white text-center text-sm">{barber.name}</p>
                   <p className="text-xs text-gold-500">{barber.specialization}</p>
                   <div className="absolute top-2 right-2 flex items-center bg-black/50 rounded px-1.5">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-xs text-white ml-1">{barber.rating}</span>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {step === 2 && (
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
                      onClick={() => { setDate(dStr); setSelectedTime(null); }}
                      className={`flex flex-col items-center min-w-[70px] p-3 rounded-xl border transition-all ${
                        date === dStr 
                          ? 'bg-gold-500 text-slate-900 border-gold-500' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
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
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-2 px-1 text-sm rounded-lg border text-center transition-all ${
                      selectedTime === slot.time
                        ? 'bg-white text-slate-900 border-white font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right-8 duration-300 max-w-lg mx-auto bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-2xl font-serif text-gold-500 mb-6 text-center">{t.confirm}</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Date & Time</span>
                <span className="text-white font-medium">{date} at {selectedTime}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span className="text-slate-400">Professional</span>
                <span className="text-white font-medium">{selectedBarber?.name || "Any Available"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-2">Services</span>
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{getServiceName(s)}</span>
                    <span className="text-slate-300">₹{s.price}</span>
                  </div>
                ))}
              </div>

              {/* Loyalty Section */}
              {user && user.role !== UserRole.GUEST && (
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="flex items-center text-gold-400 text-sm gap-1">
                      <Award size={14} /> {t.availablePoints}
                    </span>
                    <span className="font-bold text-white">{pointsAvailable}</span>
                  </div>
                  
                  {pointsAvailable > 0 ? (
                     <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="redeemPoints"
                          checked={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.checked)}
                          className="w-4 h-4 text-gold-500 rounded focus:ring-gold-500 bg-slate-800 border-slate-600"
                        />
                        <label htmlFor="redeemPoints" className="text-sm text-slate-300 cursor-pointer select-none">
                          {t.redeemPoints} (Max ₹{maxRedeemable})
                        </label>
                     </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">{t.insufficientPoints}</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-700 mt-4 space-y-2">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Subtotal</span>
                  <span>₹{subTotal}</span>
                </div>
                {redeemPoints && (
                  <div className="flex justify-between text-green-400 text-sm">
                    <span>{t.discount}</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-end">
                  <span className="text-lg text-white font-serif">{t.payOnly}</span>
                  <span className="text-2xl text-gold-500 font-bold">₹{finalTotal}</span>
                </div>
                {user && (
                  <div className="text-right text-xs text-gold-600">
                    {t.earnPoints}: +{pointsToEarn} pts
                  </div>
                )}
              </div>
            </div>

            <Button fullWidth onClick={handleConfirm} isLoading={isProcessing}>
               {t.confirm}
            </Button>
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
              (step === 2 && !selectedTime)
            }
          >
            Next Step
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
             // Since we can't easily access setUsers here inside setAppointments without complex refactoring or effects,
             // we will trigger a side-effect via a helper or assume immediate consistency isn't critical for this demo,
             // BUT, we should do it right. 
             // Instead, let's update the points on the appointment object itself for record keeping
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
      <div className="min-h-screen flex flex-col font-sans selection:bg-gold-500 selection:text-slate-900" onClick={() => setLangOpen(false)}>
        
        {/* NAVBAR */}
        <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setView('home')}
            >
              <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center text-slate-900 font-bold font-serif text-xl">P</div>
              <h1 className="text-xl font-serif text-white tracking-wide">{APP_NAME}</h1>
            </div>

            <div className="hidden md:flex items-center gap-6">
               <button onClick={() => setView('home')} className={`text-sm font-medium hover:text-gold-500 ${view === 'home' ? 'text-gold-500' : 'text-slate-300'}`}>Home</button>
               {user?.role === UserRole.ADMIN && (
                 <button onClick={() => setView('admin')} className={`text-sm font-medium hover:text-gold-500 ${view === 'admin' ? 'text-gold-500' : 'text-slate-300'}`}>{t.adminDashboard}</button>
               )}
               {user && (
                 <button onClick={() => setView('profile')} className={`text-sm font-medium hover:text-gold-500 ${view === 'profile' ? 'text-gold-500' : 'text-slate-300'}`}>My Profile</button>
               )}
               
               {/* Language Dropdown */}
               <div className="relative" onClick={(e) => e.stopPropagation()}>
                 <button 
                   onClick={() => setLangOpen(!langOpen)}
                   className="flex items-center gap-2 text-slate-300 hover:text-white text-sm bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                 >
                   <Globe size={14} />
                   <span className="uppercase">{language}</span>
                   <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {langOpen && (
                   <div className="absolute top-full right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
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
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400">{t.welcome},</p>
                    <p className="text-sm font-medium text-white">{user.name.split(' ')[0]}</p>
                  </div>
                  <Button variant="outline" className="p-2" onClick={() => contextValue.logout()}>
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowLogin(true)} className="gap-2">
                  <UserIcon size={16} />
                  <span className="hidden sm:inline">{t.login}</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 container mx-auto px-4 py-6">
          
          {/* HOME VIEW */}
          {view === 'home' && (
            <div className="space-y-16">
              {/* Hero */}
              <section className="relative rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center text-center px-4">
                <div className="absolute inset-0">
                  <img 
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80" 
                    alt="Salon Background" 
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                </div>
                
                <div className="relative z-10 max-w-3xl space-y-6 animate-in slide-in-from-bottom-10 duration-700">
                   <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight">
                     {t.welcome} <span className="text-gold-500 italic block">{APP_NAME}</span>
                   </h1>
                   <p className="text-lg text-slate-300">Experience premium grooming services tailored for the modern gentleman.</p>
                   <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                     <Button 
                        className="h-12 px-8 text-lg" 
                        onClick={() => setView('booking')}
                      >
                       {t.bookNow}
                     </Button>
                     <Button 
                       variant="outline" 
                       className="h-12 px-8 text-lg"
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
                  <Card key={i} className="flex flex-col items-center text-center p-6 bg-slate-800/50">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-gold-500 mb-4">
                      <f.icon />
                    </div>
                    <h3 className="text-xl font-serif text-white mb-2">{f.title}</h3>
                    <p className="text-slate-400 text-sm">{f.desc}</p>
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
               <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle size={40} />
               </div>
               <h2 className="text-3xl font-serif text-white mb-2">Booking Confirmed!</h2>
               <p className="text-slate-400 mb-8 max-w-md">
                 We've sent a confirmation SMS to your phone. We look forward to seeing you at Padla Hair Salon.
               </p>
               <div className="flex gap-4">
                 <Button onClick={() => setView('home')}>Back to Home</Button>
                 <Button variant="outline" onClick={() => setView('profile')}>View My Bookings</Button>
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
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-2xl font-bold text-slate-900">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white">{user.name}</h2>
                  <p className="text-slate-400">{user.phone}</p>
                  <p className="text-gold-500 text-sm mt-1 flex items-center gap-1">
                    <Award size={14} /> {t.loyaltyPoints}: {user.loyaltyPoints}
                  </p>
                </div>
              </div>

              <h3 className="text-xl text-white border-b border-slate-700 pb-2">{t.history}</h3>
              <div className="space-y-4">
                {[...user.visitHistory, ...appointments.filter(a => a.userId === user.id)].reverse().map((apt, i) => (
                   <Card key={i} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{apt.date} • {apt.timeSlot}</p>
                        <p className="text-sm text-slate-400">{apt.services.map(s => s.name).join(', ')}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-sm px-2 py-1 rounded bg-slate-700 text-slate-300 block mb-1">{apt.status}</span>
                         <span className="text-xs text-slate-500">₹{apt.totalPrice}</span>
                      </div>
                   </Card>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* FOOTER */}
        <footer className="bg-slate-950 border-t border-slate-900 py-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-center md:text-left">
               <h3 className="text-gold-500 font-serif font-bold text-lg mb-1">{APP_NAME}</h3>
               <p className="text-slate-500 text-sm">Premium styling since 2024.</p>
             </div>
             
             <div className="flex gap-4">
               <Button variant="outline" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                 <Phone size={16} />
               </Button>
               <Button variant="outline" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                 <MapPin size={16} />
               </Button>
               <Button variant="outline" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                 <Globe size={16} />
               </Button>
             </div>
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
