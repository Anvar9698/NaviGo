import { GasStation, GasStationUpdatePayload, GasType } from '@yol/shared';

class GasStationStore {
  private stations: Map<string, GasStation> = new Map();

  constructor() {
    this.initDefaultStations();
  }

  private initDefaultStations() {
    const list: GasStation[] = [
      // Toshkent Shahri & Viloyati
      {
        id: 'cng-tash-chilonzor',
        name: 'Mustaqillik Metan Gaz (Kichik Halqa)',
        brand: 'Mustaqillik Gaz',
        fuels: ['metan', 'propan'],
        latitude: 41.2785,
        longitude: 69.2085,
        city: 'Toshkent',
        address: 'Chilonzor tumani, Kichik halqa yo‘li, 12-uy',
        isOpen: true,
        pressureBar: 205,
        queueCarsCount: 5,
        waitMinutesEstimated: 8,
        pricePerUnit: { metan: 3800, propan: 5200 },
        lastReportedMinutesAgo: 4,
        verifiedByDriversCount: 38,
        statusNote: "Bosim a'lo darajada (205 Bar). Navbat tez siljimoqda."
      },
      {
        id: 'cng-tash-yunusobod',
        name: 'Real Gaz Metan & Propan',
        brand: 'Real Gaz',
        fuels: ['metan', 'propan', 'petrol'],
        latitude: 41.3642,
        longitude: 69.2891,
        city: 'Toshkent',
        address: 'Yunusobod tumani, Amir Temur ko‘chasi, 19-mavze',
        isOpen: true,
        pressureBar: 195,
        queueCarsCount: 11,
        waitMinutesEstimated: 16,
        pricePerUnit: { metan: 3800, propan: 5100, petrolAi92: 10200 },
        lastReportedMinutesAgo: 7,
        verifiedByDriversCount: 54,
        statusNote: "Bosim barqaror (195 Bar). 6 ta kolonka ishlab turibdi."
      },
      {
        id: 'cng-tash-sergeli',
        name: 'Yangi Hayot CNG Station',
        brand: 'UNG Petro',
        fuels: ['metan'],
        latitude: 41.2210,
        longitude: 69.2150,
        city: 'Toshkent',
        address: 'Sergeli tumani, Yangi Sergeli ko‘chasi',
        isOpen: true,
        pressureBar: 210,
        queueCarsCount: 2,
        waitMinutesEstimated: 4,
        pricePerUnit: { metan: 3750 },
        lastReportedMinutesAgo: 2,
        verifiedByDriversCount: 82,
        statusNote: "Navbat deyarli yo'q! Bosim 210 Bar. Tez to'ldirish mumkin."
      },
      {
        id: 'cng-tash-rohat',
        name: 'Rohat Aylanmasi Carvon Metan',
        brand: 'Carvon Gaz',
        fuels: ['metan', 'propan'],
        latitude: 41.2850,
        longitude: 69.3780,
        city: 'Toshkent',
        address: 'Bektemir tumani, Rohat aylanma yo‘li',
        isOpen: true,
        pressureBar: 180,
        queueCarsCount: 18,
        waitMinutesEstimated: 25,
        pricePerUnit: { metan: 3800, propan: 5300 },
        lastReportedMinutesAgo: 10,
        verifiedByDriversCount: 29,
        statusNote: "Vodiy yo'nalishidagi mashinalar ko'p. Kutish vaqti ~25 min."
      },
      {
        id: 'cng-tash-chinoz-m39',
        name: 'Chinoz M39 Trans-Gaz',
        brand: 'Mustaqillik Gaz',
        fuels: ['metan', 'propan', 'petrol'],
        latitude: 40.9412,
        longitude: 68.7580,
        city: 'Toshkent viloyati',
        address: 'M39 xalqaro trassasi, Chinoz posti yaqinida',
        isOpen: true,
        pressureBar: 200,
        queueCarsCount: 7,
        waitMinutesEstimated: 10,
        pricePerUnit: { metan: 3800, propan: 5200 },
        lastReportedMinutesAgo: 5,
        verifiedByDriversCount: 61,
        statusNote: "Trassa bo'yida bosim yaxshi, yuk va yengil mashinalar alohida."
      },
      {
        id: 'cng-tash-angren-a373',
        name: 'Angren Qamchiqoldi Metan',
        brand: 'UNG Petro',
        fuels: ['metan'],
        latitude: 41.0180,
        longitude: 70.1350,
        city: 'Toshkent viloyati',
        address: 'A373 trassasi, Qamchiq dovoni boshlanishi',
        isOpen: true,
        pressureBar: 215,
        queueCarsCount: 14,
        waitMinutesEstimated: 20,
        pricePerUnit: { metan: 3800 },
        lastReportedMinutesAgo: 6,
        verifiedByDriversCount: 95,
        statusNote: "Dovonga chiqishdan oldin to'ldirib olish tavsiya etiladi (215 Bar)."
      },

      // Samarqand
      {
        id: 'cng-sam-m39',
        name: 'Samarqand M39 Buyuk Ipak Gaz',
        brand: 'Real Gaz',
        fuels: ['metan', 'propan'],
        latitude: 39.6750,
        longitude: 66.9210,
        city: 'Samarqand',
        address: 'M39 trassasi, Samarqand aylanma yo‘li',
        isOpen: true,
        pressureBar: 190,
        queueCarsCount: 8,
        waitMinutesEstimated: 12,
        pricePerUnit: { metan: 3800, propan: 5100 },
        lastReportedMinutesAgo: 8,
        verifiedByDriversCount: 42,
        statusNote: "Bosim 190 Bar. Katta navbat yo'q."
      },
      {
        id: 'cng-sam-registan',
        name: 'Registon City Eco-Metan',
        brand: 'UNG Petro',
        fuels: ['metan'],
        latitude: 39.6420,
        longitude: 66.9950,
        city: 'Samarqand',
        address: 'Dahbed ko‘chasi, Samarqand',
        isOpen: false,
        pressureBar: 120,
        queueCarsCount: 0,
        waitMinutesEstimated: 0,
        pricePerUnit: { metan: 3800 },
        lastReportedMinutesAgo: 15,
        verifiedByDriversCount: 19,
        statusNote: "Vaqtincha profilaktika (texnik tanaffus soat 16:00 gacha)."
      },

      // Farg'ona Vodiysi
      {
        id: 'cng-nam-chust',
        name: 'Chust Vodiy Metan Bazasi',
        brand: 'Mustaqillik Gaz',
        fuels: ['metan', 'propan'],
        latitude: 41.0080,
        longitude: 71.2210,
        city: 'Namangan',
        address: 'Chust shahri, Kosonsoy yo‘li yoqasi',
        isOpen: true,
        pressureBar: 205,
        queueCarsCount: 6,
        waitMinutesEstimated: 9,
        pricePerUnit: { metan: 3800, propan: 5300 },
        lastReportedMinutesAgo: 3,
        verifiedByDriversCount: 67,
        statusNote: "Bosim 205 Bar. Navbat tez o'tmoqda."
      },
      {
        id: 'cng-fer-center',
        name: 'Farg‘ona Neft Gaz Metan',
        brand: 'Carvon Gaz',
        fuels: ['metan', 'propan'],
        latitude: 40.3890,
        longitude: 71.7780,
        city: 'Farg‘ona',
        address: 'Marg‘iloniy ko‘chasi, Farg‘ona markazi',
        isOpen: true,
        pressureBar: 185,
        queueCarsCount: 10,
        waitMinutesEstimated: 14,
        pricePerUnit: { metan: 3800, propan: 5200 },
        lastReportedMinutesAgo: 6,
        verifiedByDriversCount: 35,
        statusNote: "Bosim o'rtacha (185 Bar). 4 ta kolonka ochiq."
      },
      {
        id: 'cng-and-center',
        name: 'Andijon Bobur Shoxobchasi',
        brand: 'Real Gaz',
        fuels: ['metan'],
        latitude: 40.7850,
        longitude: 72.3390,
        city: 'Andijon',
        address: 'Bobur shoh ko‘chasi, Andijon',
        isOpen: true,
        pressureBar: 200,
        queueCarsCount: 9,
        waitMinutesEstimated: 13,
        pricePerUnit: { metan: 3800 },
        lastReportedMinutesAgo: 4,
        verifiedByDriversCount: 58,
        statusNote: "Bosim a'lo (200 Bar). To'lov barcha usullarda qabul qilinadi."
      },

      // Buxoro
      {
        id: 'cng-bux-kogon',
        name: 'Buxoro-Kogon Xalqaro Metan',
        brand: 'UNG Petro',
        fuels: ['metan', 'propan'],
        latitude: 39.7520,
        longitude: 64.4550,
        city: 'Buxoro',
        address: 'Kogon shossesi, Buxoro chiqish yo‘li',
        isOpen: true,
        pressureBar: 195,
        queueCarsCount: 4,
        waitMinutesEstimated: 6,
        pricePerUnit: { metan: 3800, propan: 5100 },
        lastReportedMinutesAgo: 5,
        verifiedByDriversCount: 31,
        statusNote: "Kogon yo'lida navbat kam, bosim 195 Bar."
      }
    ];

    list.forEach(s => {
      s.prices = s.prices || s.pricePerUnit;
      s.estimatedWaitMinutes = s.estimatedWaitMinutes ?? s.waitMinutesEstimated;
      s.updatedAt = s.updatedAt || new Date().toISOString();
      s.communityVotes = s.communityVotes || { goodPressure: 28, lowQueue: 14, highQueue: 3, closed: 0 };
      this.stations.set(s.id, s);
    });
  }

  public getAll(fuel?: string, search?: string, userLat?: number, userLon?: number): (GasStation & { distanceKm?: number })[] {
    let result = Array.from(this.stations.values());

    if (fuel && fuel !== 'all') {
      result = result.filter(s => s.fuels.includes(fuel as GasType));
    }

    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q)
      );
    }

    // Attach distance if GPS given
    if (userLat !== undefined && userLon !== undefined) {
      return result.map(s => {
        const dLat = (s.latitude - userLat) * (Math.PI / 180);
        const dLon = (s.longitude - userLon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * (Math.PI / 180)) *
            Math.cos(s.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distanceKm = Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
        return { ...s, distanceKm };
      }).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return result;
  }

  public getById(id: string): GasStation | undefined {
    return this.stations.get(id);
  }

  public updateReport(id: string, payload: GasStationUpdatePayload): GasStation | undefined {
    const station = this.stations.get(id);
    if (!station) return undefined;

    if (payload.isOpen !== undefined) {
      station.isOpen = payload.isOpen;
    }
    if (payload.pressureBar !== undefined) {
      station.pressureBar = payload.pressureBar;
    }
    if (payload.queueCarsCount !== undefined) {
      station.queueCarsCount = payload.queueCarsCount;
      station.waitMinutesEstimated = Math.max(2, Math.round(payload.queueCarsCount * 1.5));
    }
    if (payload.note) {
      station.statusNote = payload.note;
    }

    if (payload.voteType) {
      if (!station.communityVotes) {
        station.communityVotes = { goodPressure: 28, lowQueue: 14, highQueue: 3, closed: 0 };
      }
      if (payload.voteType === 'good_pressure') {
        station.communityVotes.goodPressure = (station.communityVotes.goodPressure || 0) + 1;
      } else if (payload.voteType === 'low_queue') {
        station.communityVotes.lowQueue = (station.communityVotes.lowQueue || 0) + 1;
      } else if (payload.voteType === 'high_queue') {
        station.communityVotes.highQueue = (station.communityVotes.highQueue || 0) + 1;
      }
    }

    station.lastReportedMinutesAgo = 0;
    station.verifiedByDriversCount += 1;
    station.updatedAt = new Date().toISOString();
    station.estimatedWaitMinutes = station.waitMinutesEstimated;
    station.prices = station.prices || station.pricePerUnit;
    this.stations.set(id, station);
    return station;
  }
}

export const gasStationStore = new GasStationStore();
