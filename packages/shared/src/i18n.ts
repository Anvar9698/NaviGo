export type SupportedLocale = 'uz' | 'ru' | 'en';

export const TRANSLATIONS = {
  uz: {
    brand: "Yo'l Ma'lumoti",
    tagline: "Xavfsiz va tushunarli yo'l axboroti",
    nav: {
      map: "Xarita",
      myReports: "Mening xabarlarim",
      help: "Yordam",
      settings: "Sozlamalar",
      admin: "Boshqaruv paneli",
      analyst: "Tahlil",
      editor: "Tahririyat"
    },
    topBar: {
      searchPlaceholder: "Qayerga bormoqchisiz?",
      voiceSearch: "Ovoz bilan qidirish",
      notifications: "Bildirishnomalar",
      account: "Hisob",
      login: "Kirish",
      logout: "Chiqish"
    },
    weather: {
      title: "Ob-havo va havo sifati",
      now: "Hozir",
      forecast: "5 kunlik ob-havo",
      airQuality: "Havo sifati",
      airGood: "Havo: Yaxshi",
      airModerate: "Havo: O'rtacha",
      airUnhealthy: "Havo: Nosog'lom",
      updatedMinutesAgo: "daqiqa oldin yangilandi",
      sourceAttribution: "Ma'lumot manbasi: Open-Meteo",
      wind: "Shamol",
      humidity: "Namlik",
      precipitation: "Yog'ingarchilik"
    },
    roads: {
      title: "Yaqiningizdagi yo'l holati",
      summarySuffix: "ta hodisa va tirbandlik",
      findAnotherWay: "Boshqa yo'l topish",
      sourceLive: "Jonli",
      sourceCommunity: "Aholi xabari",
      sourceOfficial: "Rasmiy",
      accidents: "Avtohalokatlar",
      traffic: "Tirbandlik",
      roadWork: "Yo'l ta'miri",
      closures: "Yopiq yo'llar",
      publicTransport: "Avtobus va metro"
    },
    map: {
      myLocation: "Mening joyim",
      reportProblem: "+ Muammo haqida xabar berish",
      whatMean: "Bu belgilar nimani anglatadi?",
      locationPrompt: "Yaqin atrofingizdagi yo'llarni ko'rish uchun joylashuvga ruxsat bering",
      allowLocation: "Ruxsat berish",
      manualPlace: "Joyni o'zim tanlayman",
      modeA: "Muhit va ob-havo",
      modeB: "Yo'llar va transport",
      modeCombined: "Umumiy ko'rinish",
      listAlternative: "Ro'yxat shaklida ko'rish"
    },
    report: {
      title: "Muammo haqida xabar berish",
      step1Title: "1-qadam: Muammo turini tanlang",
      step2Title: "2-qadam: Joylashuv va fotosurat",
      step3Title: "3-qadam: Tekshirish va yuborish",
      safetyWarning: "Iltimos, mashina haydash yoki piyoda xavfli joyda yurish paytida suratga olmang!",
      categories: {
        damage: "Yo'l shikastlanishi / Chuqur",
        closure: "Kutilmagan yo'l yopilishi",
        construction: "Yo'l ta'mirlash ishlari",
        hazard: "Xavfli to'siq yoki buyum",
        signage: "Yo'l belgisi buzilgan",
        transit: "Jamoat transporti to'xtab qolgan",
        map_error: "Xaritadagi xatolik",
        other: "Boshqa muammo"
      },
      confirmLocation: "Belgi to'g'ri joyda joylashganmi?",
      addPhoto: "Fotosurat biriktirish (ixtiyoriy)",
      addNote: "Qisqacha izoh yozing yoki ayting",
      submitButton: "Xabarni yuborish",
      successTitle: "Rahmat! Xabaringiz qabul qilindi.",
      successDesc: "Mutaxassislarimiz tez orada xabaringizni tekshirib, xaritaga kiritadi.",
      trackStatus: "Holatni kuzatish"
    },
    accessibility: {
      title: "Qulaylik sozlamalari",
      textSize: "Matn o'lchami",
      theme: "Rang mavzusi",
      themeLight: "Yorug' (Odatiy)",
      themeDark: "Qorong'i",
      themeHighContrast: "Yuqori kontrast (Kattalar uchun)",
      reduceMotion: "Harakatlarni kamaytirish",
      voiceSpeed: "Ovoz tezligi"
    },
    common: {
      loading: "Yuklanmoqda...",
      error: "Xatolik yuz berdi",
      retry: "Qayta urinish",
      close: "Yopish",
      back: "Orqaga",
      next: "Keyingisi",
      save: "Saqlash"
    }
  },

  ru: {
    brand: "Йўл Маълумоти",
    tagline: "Безопасная и понятная дорожная информация",
    nav: {
      map: "Карта",
      myReports: "Мои сообщения",
      help: "Помощь",
      settings: "Настройки",
      admin: "Панель управления",
      analyst: "Аналитика",
      editor: "Редакция"
    },
    topBar: {
      searchPlaceholder: "Куда вы хотите поехать?",
      voiceSearch: "Голосовой поиск",
      notifications: "Уведомления",
      account: "Аккаунт",
      login: "Войти",
      logout: "Выйти"
    },
    weather: {
      title: "Погода и воздух",
      now: "Сейчас",
      forecast: "Прогноз на 5 дней",
      airQuality: "Качество воздуха",
      airGood: "Воздух: Чистый",
      airModerate: "Воздух: Умеренный",
      airUnhealthy: "Воздух: Неблагоприятный",
      updatedMinutesAgo: "мин. назад",
      sourceAttribution: "Источник: Open-Meteo",
      wind: "Ветер",
      humidity: "Влажность",
      precipitation: "Осадки"
    },
    roads: {
      title: "Дорожная обстановка рядом",
      summarySuffix: "событий на дорогах",
      findAnotherWay: "Найти другой путь",
      sourceLive: "В реальном времени",
      sourceCommunity: "От жителей",
      sourceOfficial: "Официально",
      accidents: "ДТП",
      traffic: "Пробки",
      roadWork: "Дорожные работы",
      closures: "Перекрытия",
      publicTransport: "Транспорт"
    },
    map: {
      myLocation: "Моё местоположение",
      reportProblem: "+ Сообщить о проблеме",
      whatMean: "Что значат эти знаки?",
      locationPrompt: "Разрешите доступ к геопозиции, чтобы увидеть дорожную обстановку рядом",
      allowLocation: "Разрешить",
      manualPlace: "Выбрать город вручную",
      modeA: "Среда и погода",
      modeB: "Дороги и транспорт",
      modeCombined: "Общий вид",
      listAlternative: "В виде списка"
    },
    report: {
      title: "Сообщить о проблеме на дороге",
      step1Title: "Шаг 1: Выберите категорию",
      step2Title: "Шаг 2: Местоположение и фото",
      step3Title: "Шаг 3: Проверка и отправка",
      safetyWarning: "Пожалуйста, не фотографируйте во время вождения или на опасных участках дороги!",
      categories: {
        damage: "Повреждение дороги / Яма",
        closure: "Внезапное перекрытие дороги",
        construction: "Ремонтные работы",
        hazard: "Опасное препятствие",
        signage: "Поврежден дорожный знак",
        transit: "Сбой в движении транспорта",
        map_error: "Неточность на карте",
        other: "Другая проблема"
      },
      confirmLocation: "Точка на карте верна?",
      addPhoto: "Прикрепить фото (по желанию)",
      addNote: "Короткий комментарий (голосом или текстом)",
      submitButton: "Отправить сообщение",
      successTitle: "Спасибо! Сообщение принято.",
      successDesc: "Наши редакторы проверят его и обновят карту.",
      trackStatus: "Отследить статус"
    },
    accessibility: {
      title: "Настройки доступности",
      textSize: "Размер текста",
      theme: "Цветовая тема",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      themeHighContrast: "Высокая контрастность (для пожилых)",
      reduceMotion: "Уменьшить анимацию",
      voiceSpeed: "Скорость озвучивания"
    },
    common: {
      loading: "Загрузка...",
      error: "Произошла ошибка",
      retry: "Повторить",
      close: "Закрыть",
      back: "Назад",
      next: "Далее",
      save: "Сохранить"
    }
  },

  en: {
    brand: "Yol Ma'lumoti",
    tagline: "Clear and safe road information",
    nav: {
      map: "Map",
      myReports: "My reports",
      help: "Help",
      settings: "Settings",
      admin: "Admin console",
      analyst: "Analytics",
      editor: "Editor"
    },
    topBar: {
      searchPlaceholder: "Where do you want to go?",
      voiceSearch: "Voice search",
      notifications: "Notifications",
      account: "Account",
      login: "Sign In",
      logout: "Log out"
    },
    weather: {
      title: "Weather & Air",
      now: "Now",
      forecast: "5-day forecast",
      airQuality: "Air Quality",
      airGood: "Air: Good",
      airModerate: "Air: Moderate",
      airUnhealthy: "Air: Unhealthy",
      updatedMinutesAgo: "min ago",
      sourceAttribution: "Source: Open-Meteo",
      wind: "Wind",
      humidity: "Humidity",
      precipitation: "Precipitation"
    },
    roads: {
      title: "Roads near you",
      summarySuffix: "hazards and slowdowns",
      findAnotherWay: "Find another way",
      sourceLive: "Live",
      sourceCommunity: "Reported by people",
      sourceOfficial: "Official",
      accidents: "Accidents",
      traffic: "Traffic jams",
      roadWork: "Road work",
      closures: "Road closures",
      publicTransport: "Bus & Tram"
    },
    map: {
      myLocation: "My location",
      reportProblem: "+ Report a problem",
      whatMean: "What do these mean?",
      locationPrompt: "Allow location to see road conditions around your area",
      allowLocation: "Allow location",
      manualPlace: "Choose place myself",
      modeA: "Environment & weather",
      modeB: "Roads & transport",
      modeCombined: "Combined view",
      listAlternative: "Switch to list view"
    },
    report: {
      title: "Report a road problem",
      step1Title: "Step 1: Choose category",
      step2Title: "Step 2: Confirm place & optional photo",
      step3Title: "Step 3: Review & Submit",
      safetyWarning: "Please do not take photos while driving or walking in hazardous traffic!",
      categories: {
        damage: "Road damage / Pothole",
        closure: "Unexpected closure",
        construction: "Road work / Repair",
        hazard: "Hazard or obstruction",
        signage: "Missing or damaged sign",
        transit: "Public transit disruption",
        map_error: "Incorrect map info",
        other: "Other travel issue"
      },
      confirmLocation: "Is this the right place?",
      addPhoto: "Attach a photo (optional)",
      addNote: "Add a note or speak",
      submitButton: "Send report",
      successTitle: "Thank you! We will check your report.",
      successDesc: "Our editorial team will review and publish the update shortly.",
      trackStatus: "Track report status"
    },
    accessibility: {
      title: "Accessibility settings",
      textSize: "Text size",
      theme: "Color theme",
      themeLight: "Light (Soft dashboard)",
      themeDark: "Dark",
      themeHighContrast: "High Contrast (Senior accessible)",
      reduceMotion: "Reduce motion",
      voiceSpeed: "Voice guidance speed"
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      close: "Close",
      back: "Back",
      next: "Next",
      save: "Save"
    }
  }
};
