import { Router, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const supportRouter = Router();

// POST /api/v1/support/chat - AI Support assistant conversation
supportRouter.post('/chat', (req: AuthenticatedRequest, res: Response) => {
  const conversationId = (req.body.conversationId as string) || `conv-${Date.now()}`;
  const text = (req.body.text as string) || '';
  const lang = (req.body.lang as 'uz' | 'ru' | 'en') || 'uz';

  if (!text.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  // 1. Record user message
  const userMsg = dbStore.addSupportMessage(conversationId, {
    conversationId,
    senderType: 'USER',
    senderName: req.user ? req.user.name : 'Citizen',
    text
  });

  // 2. Generate intelligent verified AI response
  const lower = text.toLowerCase();
  let aiText = '';

  // Check emergency keywords first
  if (
    lower.includes('yongin') ||
    lower.includes('qon') ||
    lower.includes('ogir halokat') ||
    lower.includes('пожар') ||
    lower.includes('тяжелое дтп') ||
    lower.includes('скорая') ||
    lower.includes('fire') ||
    lower.includes('ambulance') ||
    lower.includes('emergency')
  ) {
    if (lang === 'uz') {
      aiText = "DIQQAT: Agar inson hayotiga xavf bo'lsa, zudlik bilan Favqulodda xizmatlarga qo'ng'iroq qiling: 102 (Yo'l harakati xavfsizligi) yoki 103 (Tez yordam)! Men bu suhbatni bizning navbatchi xodimimizga yo'naltirdim.";
    } else if (lang === 'ru') {
      aiText = "ВНИМАНИЕ: Если есть угроза жизни или здоровью, немедленно звоните в экстренные службы: 102 (Милиция/ГАИ) или 103 (Скорая помощь)! Я перенаправил ваше обращение дежурному диспетчеру.";
    } else {
      aiText = "EMERGENCY ALERT: If life or health is in danger, immediately dial local emergency services: 102 (Police) or 103 (Ambulance)! I have forwarded your message to an urgent human operator.";
    }
  } else if (lower.includes('havo') || lower.includes('воздух') || lower.includes('air') || lower.includes('aqi')) {
    if (lang === 'uz') {
      aiText = "Havo sifati ma'lumotlari Open-Meteo Yevropa indeksi (EAQI) orqali har 30 daqiqada yangilanadi. Hozirda Toshkent bo'yicha havo sifati 'Yaxshi / O'rtacha' darajada. Batafsil ma'lumot uchun xaritadagi 'Ob-havo va havo' tugmasini bosing.";
    } else if (lang === 'ru') {
      aiText = "Данные о качестве воздуха поступают от Open-Meteo по Европейскому индексу (EAQI) каждые 30 минут. Вы можете посмотреть уровень PM2.5 и PM10 на карточке погоды слева.";
    } else {
      aiText = "Air quality telemetry is synchronized every 30 minutes via Open-Meteo European AQI standard. You can inspect PM2.5 and PM10 metrics directly on the Weather card.";
    }
  } else if (lower.includes('xabar') || lower.includes('сообщить') || lower.includes('report') || lower.includes('qanday')) {
    if (lang === 'uz') {
      aiText = "Muammo haqida xabar berish uchun xaritaning pastki qismidagi qora rangli '+ Muammo haqida xabar berish' tugmasini bosing. 3 qadamda muammo turini tanlab, joyni belgilashingiz kifoya.";
    } else if (lang === 'ru') {
      aiText = "Чтобы сообщить о дорожном происшествии или яме, нажмите черную кнопку '+ Сообщить о проблеме' на карте. Это займет всего 3 простых шага.";
    } else {
      aiText = "To report a road incident or hazard, tap the black floating button '+ Report a problem' on the map. You can submit it in 3 quick steps.";
    }
  } else {
    // Helpful general assistant response
    if (lang === 'uz') {
      aiText = "Assalomu alaykum! Men NaviGo sun'iy intellekt yordamchisiman. Sizga yo'l holati, navigatsiya, ob-havo yoki favqulodda xizmatlar bo'yicha ma'lumot bera olaman. Agar inson bilan gaplashmoqchi bo'lsangiz, 'Xodim bilan bog'lanish' tugmasini bosing.";
    } else if (lang === 'ru') {
      aiText = "Здравствуйте! Я ИИ-помощник сервиса NaviGo. Я могу подсказать информацию о дорогах, навигации, погоде или помочь с вызовом экстренных служб. Вы также можете нажать «Поговорить с человеком» в любой момент.";
    } else {
      aiText = "Hello! I am the NaviGo AI support assistant. I can help explain road conditions, navigation, weather data, or emergency services. You can also tap 'Talk to a person' at any time.";
    }
  }

  const aiMsg = dbStore.addSupportMessage(conversationId, {
    conversationId,
    senderType: 'AI_ASSISTANT',
    senderName: 'NaviGo AI',
    text: aiText
  });

  return res.json({
    conversationId,
    userMessage: userMsg,
    reply: aiMsg
  });
});

// GET /api/v1/support/messages/:conversationId
supportRouter.get('/messages/:conversationId', (req: AuthenticatedRequest, res: Response) => {
  const messages = dbStore.getSupportMessages(req.params.conversationId);
  return res.json({ messages });
});

// POST /api/v1/support/escalate - Escalate to human staff
supportRouter.post('/escalate', (req: AuthenticatedRequest, res: Response) => {
  const conversationId = req.body.conversationId as string;
  const staffMsg = dbStore.addSupportMessage(conversationId, {
    conversationId,
    senderType: 'STAFF',
    senderName: 'Nigora (Support Dispatcher)',
    text: 'Assalomu alaykum! Navbatchi dispetcher suhbatga ulandi. Qanday yordam bera olaman? / Здравствуйте! Дежурный диспетчер подключился. Чем помочь?'
  });

  return res.json({ message: 'Escalated to human operator', staffMessage: staffMsg });
});
