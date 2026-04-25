export interface Trek {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Moderate" | "Challenging" | "Strenuous";
  maxAltitude: string;
  bestSeason: string;
  groupSize: string;
  price: string;
  image: string;
  featured: boolean;
  highlights: string[];
  itinerary: { day: number; title: string; description: string }[];
  gallery?: string[];
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "info" | "warning" | "success";
}

export interface JournalEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockTreks: Trek[] = [
  {
    id: "1",
    title: "Everest Base Camp Trek",
    description: "Experience the ultimate Himalayan adventure with stunning views of the world's highest peak. This iconic trek takes you through Sherpa villages, Buddhist monasteries, and breathtaking mountain landscapes.",
    duration: "14 Days",
    difficulty: "Challenging",
    maxAltitude: "5,364m / 17,598ft",
    bestSeason: "March-May, Sept-Nov",
    groupSize: "2-12 people",
    price: "$1,450 per person",
    image: "https://images.unsplash.com/photo-1700556581867-58061f78bb76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: true,
    highlights: [
      "Witness sunrise over Mount Everest",
      "Visit Tengboche Monastery",
      "Experience Sherpa culture and hospitality",
      "Cross famous suspension bridges",
      "Trek through Sagarmatha National Park"
    ],
    itinerary: [
      { day: 1, title: "Arrival in Kathmandu", description: "Welcome to Nepal! Transfer to hotel and trek briefing." },
      { day: 2, title: "Fly to Lukla, Trek to Phakding", description: "Scenic mountain flight followed by gentle trek to Phakding." },
      { day: 3, title: "Phakding to Namche Bazaar", description: "Cross suspension bridges and climb to the vibrant Sherpa town." },
      { day: 4, title: "Acclimatization Day in Namche", description: "Explore Namche Bazaar and hike to Everest View Hotel." }
    ]
  },
  {
    id: "2",
    title: "Annapurna Circuit Trek",
    description: "One of the world's most diverse treks, circling the Annapurna massif through varied landscapes from subtropical forests to high alpine terrain.",
    duration: "16 Days",
    difficulty: "Challenging",
    maxAltitude: "5,416m / 17,769ft",
    bestSeason: "March-May, Oct-Nov",
    groupSize: "2-10 people",
    price: "$1,350 per person",
    image: "https://images.unsplash.com/photo-1700556581902-6aa21e96507c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: true,
    highlights: [
      "Cross Thorong La Pass at 5,416m",
      "Experience diverse landscapes and cultures",
      "Visit sacred Muktinath Temple",
      "Walk through deepest gorge in the world",
      "Relax in natural hot springs"
    ],
    itinerary: [
      { day: 1, title: "Arrival in Kathmandu", description: "Hotel transfer and preparation." },
      { day: 2, title: "Drive to Besisahar, Trek to Bhulbhule", description: "Begin the circuit adventure." },
      { day: 3, title: "Bhulbhule to Chamje", description: "Trek through terraced fields and villages." }
    ]
  },
  {
    id: "3",
    title: "Langtang Valley Trek",
    description: "A perfect introduction to Himalayan trekking, offering stunning mountain views, Tamang culture, and lush valleys close to Kathmandu.",
    duration: "8 Days",
    difficulty: "Moderate",
    maxAltitude: "3,870m / 12,697ft",
    bestSeason: "March-May, Sept-Nov",
    groupSize: "2-15 people",
    price: "$750 per person",
    image: "https://images.unsplash.com/photo-1701255136052-b33f78a886a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: false,
    highlights: [
      "Explore beautiful Langtang Valley",
      "Visit ancient Kyanjin Gompa",
      "Experience Tamang culture",
      "Panoramic Himalayan views",
      "Close proximity to Kathmandu"
    ],
    itinerary: []
  },
  {
    id: "4",
    title: "Manaslu Circuit Trek",
    description: "Off-the-beaten-path adventure around the world's eighth highest mountain with pristine nature and authentic local culture.",
    duration: "14 Days",
    difficulty: "Strenuous",
    maxAltitude: "5,106m / 16,752ft",
    bestSeason: "March-May, Sept-Nov",
    groupSize: "2-8 people",
    price: "$1,550 per person",
    image: "https://images.unsplash.com/photo-1554710869-95f3df6a3197?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: true,
    highlights: [
      "Remote and less crowded trails",
      "Cross Larkya La Pass",
      "Buddhist monasteries and mani walls",
      "Views of Manaslu (8,163m)",
      "Rich biodiversity"
    ],
    itinerary: []
  },
  {
    id: "5",
    title: "Gokyo Lakes Trek",
    description: "Trek to the stunning turquoise Gokyo Lakes and climb Gokyo Ri for breathtaking views of Everest, Lhotse, Makalu, and Cho Oyu.",
    duration: "12 Days",
    difficulty: "Challenging",
    maxAltitude: "5,357m / 17,575ft",
    bestSeason: "March-May, Oct-Nov",
    groupSize: "2-12 people",
    price: "$1,350 per person",
    image: "https://images.unsplash.com/photo-1700556581932-6702dd09167c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: false,
    highlights: [
      "Six sacred Gokyo Lakes",
      "Panoramic views from Gokyo Ri",
      "Ngozumpa Glacier exploration",
      "Less crowded than EBC route",
      "Stunning alpine scenery"
    ],
    itinerary: []
  },
  {
    id: "6",
    title: "Poon Hill Trek",
    description: "A short and sweet trek perfect for beginners, offering spectacular sunrise views over the Annapurna and Dhaulagiri ranges.",
    duration: "5 Days",
    difficulty: "Easy",
    maxAltitude: "3,210m / 10,532ft",
    bestSeason: "Year-round",
    groupSize: "2-20 people",
    price: "$450 per person",
    image: "https://images.unsplash.com/photo-1761226546430-e44f267fde3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw2fHxOZXBhbCUyMEhpbWFsYXlhcyUyMG1vdW50YWlucyUyMEV2ZXJlc3QlMjB0cmVrfGVufDF8fHx8MTc3NjkyOTg0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    featured: false,
    highlights: [
      "Spectacular sunrise from Poon Hill",
      "360-degree mountain panorama",
      "Charming Gurung villages",
      "Rhododendron forests",
      "Perfect for families"
    ],
    itinerary: []
  }
];

export const mockJournalEntries: JournalEntry[] = [
  {
    id: "j1",
    title: "The Ultimate Guide to Everest Base Camp",
    slug: "ultimate-guide-ebc",
    excerpt: "Everything you need to know before embarking on the world's most famous trek, from gear to acclimatization.",
    content: "Full content here...",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    category: "Trekking Tips",
    author: "Ujwal Chhetri",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "j2",
    title: "Hidden Gems of the Langtang Valley",
    slug: "hidden-gems-langtang",
    excerpt: "Explore the less-traveled paths and ancient monasteries of the beautiful Langtang region.",
    content: "Full content here...",
    image: "https://images.unsplash.com/photo-1582297129188-46765796a92d",
    category: "Cultural",
    author: "Ujwal Chhetri",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "j3",
    title: "Best Season for Himalayan Trekking",
    slug: "best-season-himalayas",
    excerpt: "Spring vs. Autumn: A detailed breakdown of the best times to visit the Himalayas for clear views.",
    content: "Full content here...",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
    category: "Weather",
    author: "Ujwal Chhetri",
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockNotices: Notice[] = [
  {
    id: "1",
    title: "Spring Season 2026 Bookings Open",
    message: "Book your spring trek now! Special early bird discounts available for bookings made before May 2026.",
    date: "2026-04-20",
    type: "success"
  },
  {
    id: "2",
    title: "Updated Travel Guidelines",
    message: "Please check the latest Nepal travel and trekking permit requirements before planning your trip.",
    date: "2026-04-15",
    type: "info"
  }
];
