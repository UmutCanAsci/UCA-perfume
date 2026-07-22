export interface Perfume {
  id: string;
  name: string;
  brand: string;
  concentration: 'Eau de Parfum' | 'Extrait de Parfum' | 'Eau de Toilette';
  gender: 'Men' | 'Women' | 'Unisex';
  mainDescription: string;
  mainDescriptionEn?: string;
  notes: {
    bas: string[]; // Baş Notaları
    kalp: string[]; // Kalp Notaları
    dip: string[]; // Dip Notaları
  };
  notesEn?: {
    bas: string[];
    kalp: string[];
    dip: string[];
  };
  olfactoryProfile: { // absolute data points out of 100 before our peak-value normalization formula runs
    Floral: number;
    Woody: number;
    Spicy: number;
    Fresh: number;
    Sweet: number;
  };
  seasonalFit: ('Mevsimsiz' | 'İlkbahar' | 'Yaz' | 'Sonbahar' | 'Kış')[];
  occasionFit: ('Gündüz' | 'Gece Eğlencesi' | 'Ofis/İş' | 'İmza Koku')[];
  seasons?: string[];
  occasions?: string[];
}

export const perfumes: Perfume[] = [
  {
    id: 'bleu-de-chanel',
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    concentration: 'Eau de Parfum',
    gender: 'Men',
    mainDescription: 'Modern erkeğin zamansız özgürlüğünü simgeleyen Bleu de Chanel, taze narenciyelerin canlandırıcı fısıltısıyla açılıp, kuru sedir ağacının asil ve kararlı gölgesinde derinleşir. Sandal ağacının kremsi sıcaklığıyla tene mühürlenen bu şedid kompozisyon, cesur ve sofistike bir imzanın ifadesidir.',
    notes: {
      bas: ['Greyfurt', 'Limon', 'Nane', 'Pembe Biber'],
      kalp: ['Zencefil', 'Hindistan Cevizi', 'Yasemin'],
      dip: ['Tütsü', 'Sedir Ağacı', 'Sandal Ağacı', 'Paçuli', 'Vetiver']
    },
    olfactoryProfile: {
      Floral: 5,
      Woody: 40,
      Spicy: 15,
      Fresh: 35,
      Sweet: 5
    },
    seasonalFit: ['İlkbahar', 'Yaz', 'Sonbahar'],
    occasionFit: ['Gündüz', 'Ofis/İş', 'İmza Koku']
  },
  {
    id: 'ganymede',
    name: 'Marc-Antoine Barrois Ganymede',
    brand: 'Marc-Antoine Barrois',
    concentration: 'Eau de Parfum',
    gender: 'Unisex',
    mainDescription: "Jüpiter'in ışıltılı uydusu Ganymede'den ilham alan bu şaheser, mineral notaların fütüristik soğukluğu ile zarif süet derinin sıcak dokunuşunu birleştirir. Ölümsüz çiçeğinin tuzlu, saman benzeri nüansları, mandalinanın mayhoş parlaklığıyla buluşarak dünyevi sınırların ötesinde, adeta kozmik bir aura yaratır.",
    notes: {
      bas: ['Mandalina', 'Safran'],
      kalp: ['Menekşe Yaprağı', 'Osmanthus', 'Ölümsüz Çiçeği'],
      dip: ['Süet Deri', 'Akigalawood', 'Mineral Akorlar']
    },
    olfactoryProfile: {
      Floral: 10,
      Woody: 30,
      Spicy: 25,
      Fresh: 25,
      Sweet: 10
    },
    seasonalFit: ['Mevsimsiz', 'İlkbahar', 'Sonbahar'],
    occasionFit: ['Gece Eğlencesi', 'Ofis/İş', 'İmza Koku']
  },
  {
    id: 'baccarat-rouge-540-extrait',
    name: 'Baccarat Rouge 540',
    brand: 'Maison Francis Kurkdjian',
    concentration: 'Extrait de Parfum',
    gender: 'Unisex',
    mainDescription: 'Işıltılı ve son derece sofistike Baccarat Rouge 540, tene adeta amber, çiçeksi ve odunsu bir esinti gibi süzülür. Yaseminin havadar dokunuşu ile safranın asil parlaklığı, gri kehribarın mineral sıcaklığıyla birleşerek şiirsel bir simya ortaya koyar. Adeta yakılmış karamelin lüks ve hipnotize edici dansı.',
    notes: {
      bas: ['Safran', 'Yasemin'],
      kalp: ['Amber Ağacı', 'Ambergris'],
      dip: ['Sedir Ağacı', 'Çam Reçinesi']
    },
    olfactoryProfile: {
      Floral: 15,
      Woody: 25,
      Spicy: 5,
      Fresh: 5,
      Sweet: 50
    },
    seasonalFit: ['Sonbahar', 'Kış'],
    occasionFit: ['Gece Eğlencesi', 'İmza Koku']
  },
  {
    id: 'aventus',
    name: 'Aventus',
    brand: 'Creed',
    concentration: 'Eau de Parfum',
    gender: 'Men',
    mainDescription: 'Güç, iktidar ve başarının kokusal bir manifestosu olan Aventus, ananasın canlandırıcı tatlılığı ile bergamotun asil ferahlığından güç alır. Huş ağacının tütsülü ve odunsu karakteri, gül ve yaseminin gizemli zarafetiyle birleşirken, meşe yosunu ve misk tabanı kokuyu zamansız bir güç sembolüne dönüştürür.',
    notes: {
      bas: ['Ananas', 'Bergamot', 'Siyah Frenk Üzümü', 'Elma'],
      kalp: ['Huş Ağacı', 'Paçuli', 'Gül', 'Fas Yasemini'],
      dip: ['Misk', 'Meşe Yosunu', 'Ambergris', 'Vanilya']
    },
    olfactoryProfile: {
      Floral: 5,
      Woody: 35,
      Spicy: 10,
      Fresh: 35,
      Sweet: 15
    },
    seasonalFit: ['İlkbahar', 'Yaz', 'Sonbahar'],
    occasionFit: ['Gündüz', 'Ofis/İş', 'İmza Koku']
  },
  {
    id: 'miss-dior-blooming-bouquet',
    name: 'Miss Dior Blooming Bouquet',
    brand: 'Dior',
    concentration: 'Eau de Toilette',
    gender: 'Women',
    mainDescription: 'Taze ve narin bir çiçek bahçesinin ilkbahardaki uyanışını simgeleyen Miss Dior Blooming Bouquet, şakayık ve Şam gülünün zarif uyumunu beyaz miskin yumuşak dokunuşuyla harmanlıyor.',
    mainDescriptionEn: 'Symbolizing the spring awakening of a fresh and delicate flower garden, Miss Dior Blooming Bouquet blends the elegant harmony of peony and Damascus rose with the soft touch of white musk.',
    notes: {
      bas: ['Sicilya Mandalinası'],
      kalp: ['Pembe Şakayık', 'Şam Gülü', 'Kayısı', 'Şeftali'],
      dip: ['Beyaz Misk']
    },
    notesEn: {
      bas: ['Sicilian Mandarin'],
      kalp: ['Pink Peony', 'Damascus Rose', 'Apricot', 'Peach'],
      dip: ['White Musk']
    },
    olfactoryProfile: {
      Floral: 80,
      Woody: 5,
      Spicy: 0,
      Fresh: 40,
      Sweet: 20
    },
    seasonalFit: ['İlkbahar', 'Yaz'],
    occasionFit: ['Gündüz', 'Ofis/İş'],
    seasons: ['Spring', 'Summer'],
    occasions: ['Casual Everyday', 'Office Safe']
  },
  {
    id: 'gucci-flora',
    name: 'Gucci Flora Gorgeous Gardenia',
    brand: 'Gucci',
    concentration: 'Eau de Parfum',
    gender: 'Women',
    mainDescription: 'Neşe dolu ve büyüleyici Gucci Flora Gorgeous Gardenia, beyaz gardenyanın gizemli ihtişamını ve güneşli armut çiçeğinin pozitif enerjisini yansıtan eşsiz bir floral kompozisyondur.',
    mainDescriptionEn: 'Joyful and enchanting, Gucci Flora Gorgeous Gardenia is a unique floral composition reflecting the mysterious grandeur of white gardenia and the positive energy of sunny pear blossom.',
    notes: {
      bas: ['Armut Çiçeği', 'Kırmızı Meyveler', 'İtalyan Mandalinası'],
      kalp: ['Beyaz Gardenya', 'Yasemin', 'Frangipani'],
      dip: ['Esmer Şeker', 'Paçuli']
    },
    notesEn: {
      bas: ['Pear Blossom', 'Red Berries', 'Italian Mandarin'],
      kalp: ['White Gardenia', 'Jasmine', 'Frangipani'],
      dip: ['Brown Sugar', 'Patchouli']
    },
    olfactoryProfile: {
      Floral: 70,
      Woody: 10,
      Spicy: 5,
      Fresh: 30,
      Sweet: 50
    },
    seasonalFit: ['İlkbahar', 'Sonbahar'],
    occasionFit: ['Gece Eğlencesi', 'İmza Koku'],
    seasons: ['Spring', 'Autumn'],
    occasions: ['Date Night', 'Signature Scent']
  },
  {
    id: 'black-xs-men',
    name: 'Black XS',
    brand: 'Paco Rabanne',
    concentration: 'Eau de Toilette',
    gender: 'Men',
    mainDescription: 'Asi ve çekici Black XS, pralin ve tarçının sıcak baharatlı tatlılığını Calabrian limonunun keskin ferahlığı ile birleştirerek kışkırtıcı bir tezat yaratır.',
    mainDescriptionEn: 'Rebellious and attractive, Black XS creates a provocative contrast by combining the warm spicy sweetness of praline and cinnamon with the sharp freshness of Calabrian lemon.',
    notes: {
      bas: ['Limon', 'Adaçayı', 'Kadife Çiçeği'],
      kalp: ['Pralin', 'Tarçın', 'Tolu Balsamı', 'Siyah Kakule'],
      dip: ['Brezilya Gül Ağacı', 'Paçuli', 'Siyah Kehribar']
    },
    notesEn: {
      bas: ['Lemon', 'Sage', 'Tagetes'],
      kalp: ['Praline', 'Cinnamon', 'Tolu Balsam', 'Black Cardamom'],
      dip: ['Brazilian Rosewood', 'Patchouli', 'Black Amber']
    },
    olfactoryProfile: {
      Floral: 5,
      Woody: 40,
      Spicy: 60,
      Fresh: 15,
      Sweet: 55
    },
    seasonalFit: ['Sonbahar', 'Kış'],
    occasionFit: ['Gündüz', 'Gece Eğlencesi'],
    seasons: ['Autumn', 'Winter'],
    occasions: ['Casual Everyday', 'Date Night']
  },
  {
    id: 'shalimar',
    name: 'Shalimar',
    brand: 'Guerlain',
    concentration: 'Eau de Parfum',
    gender: 'Women',
    mainDescription: 'Tarihin ilk oryantal parfümü olarak bilinen Shalimar, bergamotun ferahlığı ve irisin pudralı zarafetiyle açılırken, efsanevi vanilya ve tonka fasulyesi ile teninizde baştan çıkarıcı bir efsane yaratır.',
    mainDescriptionEn: 'Known as history\'s first oriental perfume, Shalimar opens with the freshness of bergamot and the powdery elegance of iris, creating a seductive legend on your skin with legendary vanilla and tonka bean.',
    notes: {
      bas: ['Bergamot', 'Limon', 'Mandalina'],
      kalp: ['İris', 'Yasemin', 'Gül', 'Vetiver'],
      dip: ['Vanilya', 'Tonka Fasulyesi', 'Tütsü', 'Sandal Ağacı']
    },
    notesEn: {
      bas: ['Bergamot', 'Lemon', 'Mandarin'],
      kalp: ['Iris', 'Jasmine', 'Rose', 'Vetiver'],
      dip: ['Vanilla', 'Tonka Bean', 'Incense', 'Sandalwood']
    },
    olfactoryProfile: {
      Floral: 15,
      Woody: 20,
      Spicy: 30,
      Fresh: 10,
      Sweet: 40
    },
    seasonalFit: ['Sonbahar', 'Kış'],
    occasionFit: ['Gece Eğlencesi', 'İmza Koku'],
    seasons: ['Autumn', 'Winter'],
    occasions: ['Date Night', 'Signature Scent']
  },
  {
    id: 'black-opium',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    concentration: 'Eau de Parfum',
    gender: 'Women',
    mainDescription: 'Karanlık ve gizemli bir enerjiyi barındıran Black Opium, adrenalin dolu kahve çekirdeklerinin uyarıcı yoğunluğunu, beyaz çiçeklerin feminenliği ve vanilyanın tatlı sıcaklığıyla harmanlıyor. Bağımlılık yaratan bu büyüleyici koku, modern ve cesur kadının geceye attığı imzadır.',
    mainDescriptionEn: 'Harboring a dark and mysterious energy, Black Opium blends the stimulating intensity of adrenaline-filled coffee beans with the femininity of white flowers and the sweet warmth of vanilla. This captivating and addictive fragrance is the signature of the modern and bold woman in the night.',
    notes: {
      bas: ['Pembe Biber', 'Portakal Çiçeği', 'Armut'],
      kalp: ['Kahve', 'Yasemin', 'Acı Badem', 'Meyan Kökü'],
      dip: ['Vanilya', 'Paçuli', 'Sedir Ağacı', 'Kaşmir Ağacı']
    },
    notesEn: {
      bas: ['Pink Pepper', 'Orange Blossom', 'Pear'],
      kalp: ['Coffee', 'Jasmine', 'Bitter Almond', 'Licorice'],
      dip: ['Vanilla', 'Patchouli', 'Cedarwood', 'Cashmere Wood']
    },
    olfactoryProfile: {
      Floral: 20,
      Woody: 15,
      Spicy: 30,
      Fresh: 5,
      Sweet: 60
    },
    seasonalFit: ['Sonbahar', 'Kış'],
    occasionFit: ['Gece Eğlencesi', 'İmza Koku'],
    seasons: ['Autumn', 'Winter'],
    occasions: ['Date Night', 'Signature Scent']
  }
];
