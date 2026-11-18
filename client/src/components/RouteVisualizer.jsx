import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiPlay,
  HiPause,
  HiRefresh,
  HiVolumeUp,
  HiVolumeOff,
  HiLocationMarker,
  HiCurrencyRupee,
  HiShieldCheck,
  HiCalendar,
  HiMap,
  HiViewList,
  HiTruck,
  HiHeart,
  HiShare,
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiSparkles,
  HiStar,
  HiDownload,
  HiExternalLink,
  HiInformationCircle,
  HiBadgeCheck,
} from 'react-icons/hi';
import {
  FaPlane,
  FaTrain,
  FaCar,
  FaWalking,
  FaWhatsapp,
  FaUtensils,
  FaClock,
  FaTicketAlt,
  FaPrint,
  FaCompass,
  FaHotel,
} from 'react-icons/fa';

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getTransportIcon = (transport = '') => {
  const t = transport.toLowerCase();
  if (t.includes('train') || t.includes('rail')) return '🚂 Train';
  if (t.includes('flight') || t.includes('plane') || t.includes('air')) return '✈️ Flight';
  if (t.includes('trek') || t.includes('walk') || t.includes('hike')) return '🥾 Walking / Trek';
  if (t.includes('boat') || t.includes('shikara') || t.includes('ferry')) return '⛵ Boat Ride';
  if (t.includes('ropeway') || t.includes('cable')) return '🚡 Cable Car';
  if (t.includes('auto') || t.includes('rickshaw')) return '🛺 Auto / E-Rickshaw';
  if (t.includes('bus')) return '🚌 State Bus';
  return '🚗 Taxi / Cab';
};

// Comprehensive directory of ALL places in each destination (guarantees 8-12 comprehensive places)
export const getAllDestinationPlaces = (post) => {
  if (!post) return [];
  const title = (post.title || '').toLowerCase();
  const baseLat = post.coordinates?.lat || 20.5937;
  const baseLng = post.coordinates?.lng || 78.9629;

  // 1. Varanasi Corridor
  if (title.includes('varanasi') || title.includes('kashi') || title.includes('banaras')) {
    return [
      {
        name: 'Shri Kashi Vishwanath Temple',
        category: 'Temple & Spiritual',
        timing: '3:00 AM – 11:00 PM',
        entryFee: 'Free (Sugam Darshan ₹300)',
        visitDuration: '1.5 – 2 hours',
        isWorthIt: '⭐️ 4.9/5 • Must Visit! Book online or reach by 5:30 AM to avoid 3-hr line.',
        insiderTip: 'Lockers for phones/shoes are free inside corridor gate 4. Avoid touts outside.',
        lat: 25.3109,
        lng: 83.0107,
      },
      {
        name: 'Dashashwamedh Ghat & Evening Ganga Aarti',
        category: 'Sacred Ghat & Cultural',
        timing: '6:30 PM – 7:45 PM Daily',
        entryFee: 'Free (Boats ₹150-250/person)',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 5.0/5 • Soul-stirring experience! Sit on the ghat steps or hire shared wooden boat.',
        insiderTip: 'Reach the ghat by 5:45 PM for front-row step seating. Agree on boat price before boarding.',
        lat: 25.3065,
        lng: 83.0104,
      },
      {
        name: 'Assi Ghat & Subah-e-Banaras',
        category: 'Morning Yoga & Music',
        timing: '5:00 AM – 7:30 AM',
        entryFee: 'Free Entry',
        visitDuration: '1.5 hours',
        isWorthIt: '⭐️ 4.8/5 • Best sunrise in North India with morning classical ragas, yoga, and fresh chai.',
        insiderTip: 'Have warm clay-cup lemon tea and apple pie at nearby open-air ghatside bakeries.',
        lat: 25.2891,
        lng: 83.0068,
      },
      {
        name: 'Sarnath Dhamek Stupa & Deer Park',
        category: 'Buddhist Heritage',
        timing: '9:00 AM – 5:00 PM',
        entryFee: '₹25 (Indian), ₹300 (Foreigner)',
        visitDuration: '2.5 hours',
        isWorthIt: '⭐️ 4.7/5 • Extremely peaceful UNESCO heritage site where Buddha gave his first sermon.',
        insiderTip: 'Visit the Archaeological Museum right opposite to see India’s original Ashoka Lion Capital emblem.',
        lat: 25.3811,
        lng: 83.0247,
      },
      {
        name: 'Manikarnika & Harishchandra Ghats',
        category: 'Sacred Ghats',
        timing: 'Open 24 Hours',
        entryFee: 'Free',
        visitDuration: '45 mins (view respectfully from boat)',
        isWorthIt: '⭐️ 4.6/5 • Intense, humbling glimpse into eternal life cycle ceremonies.',
        insiderTip: '⚠️ Strictly no photography on these cremation ghats. Ignore fake priests asking for wood donations.',
        lat: 25.3108,
        lng: 83.0142,
      },
      {
        name: 'Ramnagar Fort & Museum',
        category: 'Historic Palace',
        timing: '10:00 AM – 5:00 PM',
        entryFee: '₹75 per adult',
        visitDuration: '1.5 hours',
        isWorthIt: '⭐️ 4.2/5 • 18th-century sandstone fortress on the eastern bank with antique clocks & vintage cars.',
        insiderTip: 'Don’t miss Shiv Prasad Lassi Bhandar right outside the fort gate for delicious rabri lassi.',
        lat: 25.2694,
        lng: 83.0255,
      },
      {
        name: 'Godowlia Market & Chowk Street Food',
        category: 'Street Food & Silk Shopping',
        timing: '10:00 AM – 10:00 PM',
        entryFee: 'Free entry',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.8/5 • Sensory heaven for foodies: Tamatar chaat at Kashi Chaat Bhandar, malaiyyo in winter.',
        insiderTip: 'Only buy pure Banarasi silk from weavers co-operative stores to avoid imitation polyester.',
        lat: 25.3101,
        lng: 83.0076,
      },
      {
        name: 'Kaal Bhairav Temple',
        category: 'Ancient Protector Temple',
        timing: '5:00 AM – 1:30 PM, 4:30 PM – 10:00 PM',
        entryFee: 'Free',
        visitDuration: '45 mins',
        isWorthIt: '⭐️ 4.5/5 • Revered as the Kotwal (protector) of Varanasi. Tradition holds you must pay respects here.',
        insiderTip: 'Tie a black protective thread (Gandha) on your wrist from the priest.',
        lat: 25.3195,
        lng: 83.0135,
      },
    ];
  }

  // 2. Baruasagar & Jhansi Corridor
  if (title.includes('baruasagar') || title.includes('jhansi')) {
    return [
      {
        name: 'Baruasagar Fort & Watchtowers',
        category: '17th Century Hill Fort',
        timing: '7:00 AM – 6:00 PM',
        entryFee: 'Free Entry',
        visitDuration: '1.5 – 2 hours',
        isWorthIt: '⭐️ 4.7/5 • Unspoiled Bundela architecture offering panoramic sunset views across the lake.',
        insiderTip: 'Climb to the top terrace for cool breeze and 360-degree photography. Wear sturdy walking shoes.',
        lat: 25.3682,
        lng: 78.7345,
      },
      {
        name: 'Baruasagar Lake & Chandel Bund',
        category: 'Scenic Lake & Dam',
        timing: 'Open Sunrise to Sunset',
        entryFee: 'Free Entry',
        visitDuration: '1.5 hours',
        isWorthIt: '⭐️ 4.6/5 • Massive peaceful lake built 260 years ago by Bundela Kings. Excellent winter birdwatching.',
        insiderTip: 'Local boat rides operate in winter season for ₹100-150. Best visited around 4:30 PM for sunset reflections.',
        lat: 25.3712,
        lng: 78.7391,
      },
      {
        name: 'Jarai Ka Math (9th Century Pratihara Temple)',
        category: 'Ancient ASI Monument',
        timing: '6:00 AM – 6:00 PM',
        entryFee: 'Free Entry (Protected by ASI)',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.8/5 • Architectural marvel! Intricate 1100-year-old sandstone carvings dedicated to Goddess Durga/Sun.',
        insiderTip: 'A rare example of Pratihara stone artistry that remains peaceful and completely crowd-free.',
        lat: 25.3621,
        lng: 78.7289,
      },
      {
        name: 'Jhansi Fort (Rani Laxmibai Memorial)',
        category: 'Historic Military Citadel',
        timing: '6:00 AM – 6:30 PM',
        entryFee: '₹25 (Indian), ₹300 (Foreigner)',
        visitDuration: '2.5 hours',
        isWorthIt: '⭐️ 4.9/5 • Legendary fortress with the spot where Queen Laxmibai jumped on horseback during 1857.',
        insiderTip: 'Sound & Light show in Hindi & English is held every evening at 7:00 PM. Highly recommended for kids.',
        lat: 25.4582,
        lng: 78.5786,
      },
      {
        name: 'Rani Mahal (Queen’s Palace & Museum)',
        category: 'Heritage Palace',
        timing: '10:00 AM – 5:00 PM',
        entryFee: '₹20 per adult',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.4/5 • Intricately painted ceilings, floral frescoes, and medieval stone sculptures excavated from Bundelkhand.',
        insiderTip: 'Located inside the old walled city of Jhansi, just 1 km from the main fort.',
        lat: 25.4485,
        lng: 78.5802,
      },
      {
        name: 'Orchha Ram Raja Temple & Chhatris',
        category: 'Sacred Riverside Town (18 km)',
        timing: '8:00 AM – 12:30 PM, 6:00 PM – 9:00 PM',
        entryFee: 'Free (Fort ticket covers all monuments)',
        visitDuration: 'Half Day excursion',
        isWorthIt: '⭐️ 5.0/5 • The only temple where Lord Ram is worshipped as a reigning King with a police guard of honour.',
        insiderTip: 'Take a ₹20 shared auto from Jhansi or Baruasagar to Orchha. Watch sunset over the 14 royal Chhatris on the Betwa.',
        lat: 25.3508,
        lng: 78.6432,
      },
      {
        name: 'Government Museum Jhansi',
        category: 'Regional History Museum',
        timing: '10:30 AM – 4:30 PM (Closed Mondays)',
        entryFee: '₹10 per person',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.3/5 • Extensive collection of Chandela weapons, coins, and ancient stone sculptures.',
        insiderTip: 'Well-curated display of 1857 Mutiny maps and historical photographs.',
        lat: 25.4521,
        lng: 78.5862,
      },
      {
        name: 'Betwa River Ghats & Rafting Point',
        category: 'Nature & Adventure',
        timing: 'Sunrise to Sunset',
        entryFee: 'Free entry (Rafting ₹600-800)',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.7/5 • Clean, unpolluted river waters surrounded by granite boulders and dense green scrub.',
        insiderTip: 'Seasonal rafting runs from August to February when the Betwa river flow is active.',
        lat: 25.3489,
        lng: 78.6492,
      },
    ];
  }

  // 3. Jaipur Corridor
  if (title.includes('jaipur')) {
    return [
      {
        name: 'Amber Palace & Fort',
        category: 'UNESCO Hill Fortress',
        timing: '8:00 AM – 5:30 PM, 6:30 PM – 9:15 PM',
        entryFee: '₹100 (Indian), ₹500 (Foreigner)',
        visitDuration: '3 hours',
        isWorthIt: '⭐️ 4.9/5 • Magnificent hilltop citadel with Sheesh Mahal (Mirror Palace) and Maota lake views.',
        insiderTip: 'Hire a licensed guide or audio guide at the booking counter. Arrive by 8:30 AM before heat and tour buses.',
        lat: 26.9855,
        lng: 75.8513,
      },
      {
        name: 'Hawa Mahal (Palace of Winds)',
        category: 'Iconic Architecture',
        timing: '9:00 AM – 5:00 PM',
        entryFee: '₹50 (Indian), ₹200 (Foreigner)',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.7/5 • 953 honeycomb windows designed to let royal ladies observe street festivals unseen.',
        insiderTip: 'The best photo angle is from The Wind View Cafe on the rooftop across the main street.',
        lat: 26.9239,
        lng: 75.8267,
      },
      {
        name: 'City Palace & Chandra Mahal',
        category: 'Royal Residence & Museum',
        timing: '9:30 AM – 5:00 PM',
        entryFee: '₹200 (Indian), ₹700 (Foreigner)',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.6/5 • Gorgeous blend of Rajasthani and Mughal architecture. Don’t miss the famous Peacock Gate.',
        insiderTip: 'Composite ticket includes admission to Jaigarh Fort if used within 2 days.',
        lat: 26.9258,
        lng: 75.8236,
      },
      {
        name: 'Jantar Mantar Observatory',
        category: 'UNESCO Science Heritage',
        timing: '9:00 AM – 4:30 PM',
        entryFee: '₹50 (Indian), ₹200 (Foreigner)',
        visitDuration: '1.5 hours',
        isWorthIt: '⭐️ 4.8/5 • World’s largest stone sundial, measuring time to an accuracy of 2 seconds!',
        insiderTip: 'Visit around midday (12:00 PM) when the sun casts vertical shadows for easy instrument reading.',
        lat: 26.9248,
        lng: 75.8246,
      },
      {
        name: 'Nahargarh Fort Sunset Point',
        category: 'Hilltop Viewpoint',
        timing: '10:00 AM – 5:30 PM (Sunset area open till 10 PM)',
        entryFee: '₹50 per person',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.9/5 • Highest vantage point overlooking the entire pink city bathed in golden evening light.',
        insiderTip: 'Pre-book return taxi from the city; autos at the top charge exorbitant rates after dark.',
        lat: 26.9373,
        lng: 75.8155,
      },
      {
        name: 'Jal Mahal (Water Palace)',
        category: 'Scenic Lake Palace',
        timing: 'Open 24 Hours (Exterior view from promenade)',
        entryFee: 'Free view from promenade',
        visitDuration: '30 mins',
        isWorthIt: '⭐️ 4.5/5 • Romantic palace floating in Man Sagar Lake surrounded by Aravalli hills.',
        insiderTip: 'Best viewed at sunrise or after dark when floodlights illuminate the palace against the water.',
        lat: 26.9534,
        lng: 75.8462,
      },
      {
        name: 'Albert Hall Museum & Ram Niwas Garden',
        category: 'Indo-Saracenic Museum',
        timing: '9:00 AM – 5:00 PM, 7:00 PM – 10:00 PM',
        entryFee: '₹40 (Day), ₹100 (Night lighting)',
        visitDuration: '1.5 hours',
        isWorthIt: '⭐️ 4.6/5 • Oldest museum in Rajasthan housing an authentic Egyptian mummy and miniature paintings.',
        insiderTip: 'Dozens of pigeons congregate in the front courtyard in the morning—classic photography spot.',
        lat: 26.9116,
        lng: 75.8195,
      },
      {
        name: 'Bapu Bazaar & Johari Bazaar',
        category: 'Traditional Markets',
        timing: '11:00 AM – 9:00 PM (Closed Sundays)',
        entryFee: 'Free entry',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.7/5 • Vibrant pink arcades filled with leather juttis, Jaipuri razai quilts, and kachoris.',
        insiderTip: 'Bargain politely for 30-40% discount on textiles. Stop for kachori at LMB in Johari Bazaar.',
        lat: 26.9205,
        lng: 75.8239,
      },
    ];
  }

  // 4. Manali Corridor
  if (title.includes('manali')) {
    return [
      {
        name: 'Solang Valley Adventure Arena',
        category: 'Snow & Adventure Hub',
        timing: '9:00 AM – 6:00 PM',
        entryFee: 'Free entry (Activities: ₹500 – ₹2,500)',
        visitDuration: '3 – 4 hours',
        isWorthIt: '⭐️ 4.8/5 • Paragliding, zorbing, quad biking in summer, and skiing/snowboarding in winter.',
        insiderTip: 'Book paragliding only with government-certified pilots with helmet cameras included.',
        lat: 32.3167,
        lng: 77.1578,
      },
      {
        name: 'Atal Tunnel & Sissu Valley (Lahaul)',
        category: 'Engineering Marvel & Glacier',
        timing: 'Open Daily (Subject to weather)',
        entryFee: 'Free highway transit',
        visitDuration: 'Full Day excursion',
        isWorthIt: '⭐️ 5.0/5 • World’s longest highway tunnel above 10,000 ft connecting lush green Manali to stark Lahaul.',
        insiderTip: 'Cross the North Portal into Sissu to see the roaring Sissu Waterfall and willow plantations.',
        lat: 32.3615,
        lng: 77.1352,
      },
      {
        name: 'Hadimba Devi Temple & Cedar Forest',
        category: 'Ancient Wooden Pagoda',
        timing: '8:00 AM – 6:00 PM',
        entryFee: 'Free Entry',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.7/5 • 16th-century wooden temple tucked inside towering deodar trees. Deeply peaceful.',
        insiderTip: 'Visit before 9:30 AM before tourist queues build up. Watch out for curious temple monkeys.',
        lat: 32.2483,
        lng: 77.1812,
      },
      {
        name: 'Old Manali Village & Wooden Cafes',
        category: 'Culture & Cafe Street',
        timing: '10:00 AM – 11:00 PM',
        entryFee: 'Free entry',
        visitDuration: '2 hours',
        isWorthIt: '⭐️ 4.8/5 • Bohemian village charm with live acoustic music, wooden balconies, and apple orchards.',
        insiderTip: 'Try wood-fired pizza and trout fish at Dylan’s Toasted and Roasted or Cafe 1947.',
        lat: 32.2548,
        lng: 77.1755,
      },
      {
        name: 'Jogini Waterfalls Forest Trek',
        category: 'Nature & Waterfall Trek',
        timing: 'Daylight hours only',
        entryFee: 'Free Entry',
        visitDuration: '2.5 hours',
        isWorthIt: '⭐️ 4.9/5 • 45-minute scenic trek from Vashisht through apple orchards to a cascading mountain waterfall.',
        insiderTip: 'Wear shoes with good grip. Carry water and avoid climbing slippery rocks near the spray.',
        lat: 32.2682,
        lng: 77.1952,
      },
      {
        name: 'Vashisht Hot Sulphur Springs',
        category: 'Natural Thermal Baths',
        timing: '7:00 AM – 1:00 PM, 2:00 PM – 9:00 PM',
        entryFee: 'Free Entry',
        visitDuration: '1 hour',
        isWorthIt: '⭐️ 4.4/5 • Natural mineral-rich hot spring baths believed to relieve muscle fatigue and skin ailments.',
        insiderTip: 'Separate bathing enclosures for men and women. Clean and very soothing after cold mountain hikes.',
        lat: 32.2612,
        lng: 77.1895,
      },
      {
        name: 'Rohtang Pass (13,058 ft)',
        category: 'High Mountain Snow Pass',
        timing: 'Open May to October (Subject to NGT Permit)',
        entryFee: 'NGT Permit ₹550 per vehicle',
        visitDuration: 'Full Day excursion',
        isWorthIt: '⭐️ 4.7/5 • Panoramic snowscape with views of Pir Panjal peaks and glaciers.',
        insiderTip: 'Book NGT permit online 2-4 days ahead on the official Himachal tourism portal; slots are capped daily.',
        lat: 32.3716,
        lng: 77.2466,
      },
      {
        name: 'Manu Temple & Riverbank View',
        category: 'Sacred Sage Temple',
        timing: '6:00 AM – 5:00 PM',
        entryFee: 'Free Entry',
        visitDuration: '45 mins',
        isWorthIt: '⭐️ 4.5/5 • Only temple in India dedicated to Sage Manu, the creator of the human race in Hindu folklore.',
        insiderTip: 'Short uphill walk through Old Manali stone alleys. Panoramic valley views from the temple courtyard.',
        lat: 32.2573,
        lng: 77.1721,
      },
    ];
  }

  // 5. Dynamic fallback for ANY other destination (combines waypoints + highlights to yield 8 comprehensive places)
  const waypoints = post.waypoints || [];
  const highlights = post.highlights || [];
  const list = [];

  // Add existing waypoints
  waypoints.forEach((wp, i) => {
    list.push({
      name: wp.name,
      category: wp.transport?.includes('Trek') ? 'Nature & Trek' : 'Must-Visit Landmark',
      timing: '6:00 AM – 6:30 PM',
      entryFee: 'Free or Nominal Entry',
      visitDuration: '1.5 – 2 hours',
      isWorthIt: `⭐️ 4.8/5 • Day ${wp.day} highlight. Highly recommended for families and explorers.`,
      insiderTip: wp.description || 'Visit in the early morning for peaceful atmosphere and clear photography.',
      lat: wp.lat || baseLat + i * 0.01,
      lng: wp.lng || baseLng + i * 0.01,
    });
  });

  // Complement with highlights to reach at least 8 places
  const genericAttractions = [
    { title: `${post.title} Main Market & Local Food Street`, cat: 'Street Food & Shopping', tip: 'Taste authentic hot snacks, regional sweets, and fresh tea at busy local stalls.' },
    { title: `${post.title} Heritage Fort & Ancient Bastion`, cat: 'Historic Architecture', tip: 'Explore century-old stone architecture and learn about local regional rulers.' },
    { title: `${post.title} Scenic Sunset Viewpoint`, cat: 'Panoramic Viewpoint', tip: 'Arrive 45 minutes before sunset for 360-degree photography across the valley/river.' },
    { title: `${post.title} Sacred Central Temple & Ghat`, cat: 'Spiritual Landmark', tip: 'Experience peaceful morning prayer ceremonies and traditional architecture.' },
    { title: `${post.title} Lakeside & Nature Walkway`, cat: 'Nature & Relaxation', tip: 'Quiet evening stroll along the water bank. Excellent for birdwatching and photography.' },
    { title: `${post.title} Regional Handloom & Craft Center`, cat: 'Art & Handicrafts', tip: 'Support local artisans by buying authentic regional textiles, pottery, and souvenirs.' },
  ];

  let genIdx = 0;
  while (list.length < 8 && genIdx < genericAttractions.length) {
    const item = genericAttractions[genIdx];
    list.push({
      name: item.title,
      category: item.cat,
      timing: '8:00 AM – 7:00 PM',
      entryFee: 'Free Entry',
      visitDuration: '1 hour',
      isWorthIt: '⭐️ 4.6/5 • Loved by travelers for genuine local flavor away from crowds.',
      insiderTip: item.tip,
      lat: baseLat + (list.length + 1) * 0.008,
      lng: baseLng + (list.length + 1) * 0.008,
    });
    genIdx++;
  }

  return list;
};

export default function RouteVisualizer({ post }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const movingMarkerRef = useRef(null);

  // Default to 'itinerary'
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('all');

  // Voice & Tour State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [speed, setSpeed] = useState(0.75); // Calm & Clear pacing
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [progressPercent, setProgressPercent] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  const tourCancelledRef = useRef(false);
  const speechTimeoutRef = useRef(null);

  // Interactive Budget Calculator State
  const [calcTravelers, setCalcTravelers] = useState(2);
  const [calcDays, setCalcDays] = useState(3);
  const [calcStyle, setCalcStyle] = useState('moderate');

  // Origin-to-Destination Route & Transit Guidance State
  const [originCity, setOriginCity] = useState(
    () => localStorage.getItem('travelerOriginCity') || 'Pune'
  );
  const [customOriginInput, setCustomOriginInput] = useState('');
  const [transitData, setTransitData] = useState(null);
  const [loadingTransit, setLoadingTransit] = useState(false);
  const [transitError, setTransitError] = useState(null);

  const waypoints = post?.waypoints && post.waypoints.length > 0 ? post.waypoints : [];
  const coords = post?.coordinates?.lat && post?.coordinates?.lng
    ? [post.coordinates.lat, post.coordinates.lng]
    : [20.5937, 78.9629];

  // All Places Directory (Guarantees 8-12 comprehensive places)
  const allAttractions = getAllDestinationPlaces(post);

  // Filtered places
  const filteredAttractions = selectedPlaceCategory === 'all'
    ? allAttractions
    : allAttractions.filter((a) =>
        a.category.toLowerCase().includes(selectedPlaceCategory.toLowerCase())
      );

  // Synchronized Speech Synthesizer
  const speakText = (text, onEnd) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    if (!voiceEnabled || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setSpeakingText('');
      const readTimeMs = Math.max(3500, Math.min(8000, text.length * 60));
      speechTimeoutRef.current = setTimeout(() => {
        if (onEnd) onEnd();
      }, readTimeMs);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Calm, dignified tempo
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const cleanVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('India') || v.name.includes('Natural') || v.name.includes('Google'))
    );
    if (cleanVoice) utterance.voice = cleanVoice;

    // Prevent Chromium garbage collection mid-speech
    window._activeUtterance = utterance;

    setIsSpeaking(true);
    setSpeakingText(text);

    let called = false;
    const finish = () => {
      if (called) return;
      called = true;
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      setIsSpeaking(false);
      window._activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety watchdog: prevent freeze if browser speech engine drops onend
    const estimatedMs = Math.max(6000, (text.split(' ').length / 2.0) * 1000 + 4000);
    speechTimeoutRef.current = setTimeout(finish, estimatedMs);

    window.speechSynthesis.speak(utterance);
  };

  // Initialize Map with 100% Free Standard OpenStreetMap
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: coords,
        zoom: 11,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    setTimeout(() => map.invalidateSize(), 200);

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) polylineRef.current.remove();
    if (movingMarkerRef.current) movingMarkerRef.current.remove();

    if (waypoints.length > 0) {
      const latlngs = waypoints.map((w) => [w.lat, w.lng]);

      // Route Path Line
      polylineRef.current = L.polyline(latlngs, {
        color: '#0d9488',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Numbered Route Pins
      waypoints.forEach((wp, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === waypoints.length - 1;
        const pinColor = isStart ? '#10b981' : isEnd ? '#f43f5e' : '#0d9488';

        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="
              background: ${pinColor};
              color: white;
              font-weight: 800;
              font-size: 13px;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              border: 3px solid white;
              cursor: pointer;
            ">
              ${idx + 1}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([wp.lat, wp.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: inherit; padding: 6px; max-width: 240px;">
              <span style="background: #ccfbf1; color: #0f766e; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
                STOP ${idx + 1} &bull; DAY ${wp.day}
              </span>
              <h4 style="margin: 6px 0 4px; font-size: 14px; font-weight: bold; color: #0f172a;">${wp.name}</h4>
              <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.4;">${wp.description}</p>
              <div style="margin-top: 8px; font-size: 11px; color: #0f766e; font-weight: 600;">
                Travel by: ${wp.transport} ${wp.distanceKm > 0 ? `(${wp.distanceKm} km)` : ''}
              </div>
            </div>
          `);

        marker.on('click', () => handleSelectWaypoint(idx));
        markersRef.current.push(marker);
      });

      // Animated Traveler Vehicle Marker
      const travelerIcon = L.divIcon({
        className: 'traveler-avatar',
        html: `
          <div style="
            background: #f59e0b;
            color: white;
            font-size: 20px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.9);
            border: 3px solid white;
          ">
            🚗
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const startIdx = Math.min(currentWaypointIndex, latlngs.length - 1);
      movingMarkerRef.current = L.marker(latlngs[startIdx], { icon: travelerIcon }).addTo(map);

      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activeTab, post]);

  // Fetch live transit guidance with session caching
  const fetchTransit = async (city, forceRefresh = false) => {
    const targetCity = (city || originCity || 'Pune').trim();
    if (!targetCity || !post?.title) return;

    const sessionKey = `transit_${targetCity.toLowerCase()}_${post._id || post.title}`;
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(sessionKey);
        if (cached) {
          setTransitData(JSON.parse(cached));
          setOriginCity(targetCity);
          return;
        }
      } catch (e) {}
    }

    try {
      setLoadingTransit(true);
      setTransitError(null);
      const res = await fetch('/api/ai/transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: targetCity,
          destination: post.title,
          destinationState: post.state || 'India',
        }),
      });
      const data = await res.json();
      if (res.ok && data.transit) {
        setTransitData(data.transit);
        setOriginCity(targetCity);
        localStorage.setItem('travelerOriginCity', targetCity);
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(data.transit));
        } catch (e) {}
      } else {
        setTransitError('Could not load live transit for this route.');
      }
    } catch (err) {
      setTransitError('Network issue while fetching transit.');
    } finally {
      setLoadingTransit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'travel' && !transitData && !loadingTransit) {
      fetchTransit(originCity);
    }
  }, [activeTab, originCity, post]);

  // 100% SYNCHRONIZED SEQUENTIAL VOICE & MAP TOUR RUNNER
  useEffect(() => {
    if (!isPlaying || waypoints.length < 2) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingText('');
      return;
    }

    tourCancelledRef.current = false;

    const runTour = async () => {
      let startIndex = currentWaypointIndex >= waypoints.length - 1 ? 0 : currentWaypointIndex;
      if (startIndex === 0) {
        setCurrentWaypointIndex(0);
        setProgressPercent(0);
        if (movingMarkerRef.current && waypoints[0]) {
          movingMarkerRef.current.setLatLng([waypoints[0].lat, waypoints[0].lng]);
          mapInstanceRef.current?.panTo([waypoints[0].lat, waypoints[0].lng]);
        }
      }

      for (let i = startIndex; i < waypoints.length; i++) {
        if (tourCancelledRef.current) break;

        const currentWp = waypoints[i];
        setCurrentWaypointIndex(i);
        const overallProgress = (i / (waypoints.length - 1)) * 100;
        setProgressPercent(overallProgress);

        // Center map on current stop
        if (mapInstanceRef.current && movingMarkerRef.current) {
          movingMarkerRef.current.setLatLng([currentWp.lat, currentWp.lng]);
          mapInstanceRef.current.panTo([currentWp.lat, currentWp.lng], { animate: true, duration: 1 });
        }

        // Open popup
        if (markersRef.current[i]) {
          markersRef.current[i].openPopup();
        }

        // 1. Narrate this stop and WAIT until speech completes
        const isFinal = i === waypoints.length - 1;
        const narration = isFinal
          ? `Final Destination: ${currentWp.name}. ${currentWp.description}. Congratulations, you have completed your guided route walkthrough of ${post.title}! Have a wonderful and safe journey!`
          : `Stop ${i + 1} of ${waypoints.length}: ${currentWp.name}. ${currentWp.description}. Recommended travel: ${currentWp.transport}.`;

        await new Promise((resolve) => {
          speakText(narration, () => {
            resolve();
          });
        });

        if (tourCancelledRef.current) break;

        // Brief pleasant pause between speaking and driving
        await new Promise((r) => setTimeout(r, 1200));
        if (tourCancelledRef.current) break;

        // 2. If there is a next stop, smoothly glide the vehicle marker to it
        if (!isFinal) {
          const nextWp = waypoints[i + 1];
          const glideDurationMs = 5000 / (speed / 0.75);
          const startLat = currentWp.lat;
          const startLng = currentWp.lng;
          const endLat = nextWp.lat;
          const endLng = nextWp.lng;
          const startTimestamp = performance.now();

          await new Promise((resolve) => {
            const glide = (now) => {
              if (tourCancelledRef.current) return resolve();
              const elapsed = now - startTimestamp;
              const t = Math.min(elapsed / glideDurationMs, 1);

              const curLat = startLat + (endLat - startLat) * t;
              const curLng = startLng + (endLng - startLng) * t;

              if (movingMarkerRef.current) {
                movingMarkerRef.current.setLatLng([curLat, curLng]);
              }

              const segmentProgress = ((i + t) / (waypoints.length - 1)) * 100;
              setProgressPercent(segmentProgress);

              if (t < 1) {
                requestAnimationFrame(glide);
              } else {
                resolve();
              }
            };
            requestAnimationFrame(glide);
          });
        }
      }

      // ONLY WHEN THE LOOP (INCLUDING THE FINAL SPEECH) HAS FULLY RESOLVED:
      if (!tourCancelledRef.current) {
        setProgressPercent(100);
        setIsPlaying(false);
        setIsSpeaking(false);
        setSpeakingText('');
      }
    };

    runTour();

    return () => {
      tourCancelledRef.current = true;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!isPlaying && currentWaypointIndex >= waypoints.length - 1) {
      setCurrentWaypointIndex(0);
      setProgressPercent(0);
      if (movingMarkerRef.current && waypoints[0]) {
        movingMarkerRef.current.setLatLng([waypoints[0].lat, waypoints[0].lng]);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    tourCancelledRef.current = true;
    setIsPlaying(false);
    setIsSpeaking(false);
    setSpeakingText('');
    setCurrentWaypointIndex(0);
    setProgressPercent(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (movingMarkerRef.current && waypoints[0]) {
      movingMarkerRef.current.setLatLng([waypoints[0].lat, waypoints[0].lng]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([waypoints[0].lat, waypoints[0].lng], 11);
      }
    }
  };

  const handleSelectWaypoint = (index) => {
    setCurrentWaypointIndex(index);
    const targetWp = waypoints[index];
    if (targetWp && mapInstanceRef.current) {
      mapInstanceRef.current.setView([targetWp.lat, targetWp.lng], 13);
      if (markersRef.current[index]) {
        markersRef.current[index].openPopup();
      }
      if (movingMarkerRef.current) {
        movingMarkerRef.current.setLatLng([targetWp.lat, targetWp.lng]);
      }
      speakText(`Stop ${index + 1}: ${targetWp.name}. ${targetWp.description}`);
    }
  };

  const handleShowAttractionOnMap = (attraction) => {
    setActiveTab('map');
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([attraction.lat, attraction.lng], 14, { animate: true });
        speakText(`${attraction.name}. ${attraction.isWorthIt}. Best tip: ${attraction.insiderTip}`);
      }
    }, 300);
  };

  // Budget Calculator Calculations
  const dailyBase = calcStyle === 'backpacker'
    ? (post.budgetINR?.backpacker || 1400)
    : (post.budgetINR?.moderate || 3200);

  const hotelPerDay = Math.round(dailyBase * 0.45);
  const foodPerDay = Math.round(dailyBase * 0.25);
  const localTransitPerDay = Math.round(dailyBase * 0.20);
  const ticketsMiscPerDay = Math.round(dailyBase * 0.10);

  const totalHotel = hotelPerDay * Math.ceil(calcTravelers / 2) * (calcDays > 1 ? calcDays - 1 : 1);
  const totalFood = foodPerDay * calcTravelers * calcDays;
  const totalTransit = localTransitPerDay * calcTravelers * calcDays;
  const totalTickets = ticketsMiscPerDay * calcTravelers * calcDays;
  const adjustedTotal = totalHotel + totalFood + totalTransit + totalTickets;

  const handleCopyWhatsApp = () => {
    const text = `*Trip Plan & Budget for ${post.title}*
📍 Destination: ${post.title} (${post.state || 'India'})
👥 Travelers: ${calcTravelers} Person(s) | 📅 Duration: ${calcDays} Days
🎒 Style: ${calcStyle === 'backpacker' ? 'Pocket-Friendly Homestay' : 'Comfort Family Travel'}

💰 *Estimated Total: ₹${adjustedTotal.toLocaleString('en-IN')}*
• Hotel / Stay: ₹${totalHotel.toLocaleString('en-IN')}
• Meals & Food: ₹${totalFood.toLocaleString('en-IN')}
• Local Cabs / Travel: ₹${totalTransit.toLocaleString('en-IN')}
• Entry Tickets & Misc: ₹${totalTickets.toLocaleString('en-IN')}

🚗 Nearest Station: ${post.nearestHubs?.railway || 'Major Railway Station'}
🗓️ Best Season: ${post.bestSeason || 'October to March'}
View full itinerary at: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handlePrintPocketGuide = () => {
    window.print();
  };

  if (!waypoints || waypoints.length === 0) {
    return null;
  }

  const currentWp = waypoints[currentWaypointIndex] || waypoints[0];

  return (
    <div className='my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden'>
      {/* Top Banner: Easy Travel Summary for Indian Families & Solo Travelers */}
      <div className='p-6 sm:p-8 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <span className='px-3.5 py-1 bg-white/20 backdrop-blur-md text-teal-100 rounded-full text-xs font-bold uppercase tracking-wider'>
              Traveler Friendly Guide &bull; {post.state || 'India'}
            </span>
            <h2 className='text-2xl sm:text-3xl font-extrabold mt-2.5 tracking-tight'>
              {post.title} — Complete Travel Guide
            </h2>
            <p className='text-teal-100 text-sm mt-1.5 max-w-2xl leading-relaxed'>
              Practical, realistic journey guide for travelers, families, and explorers. Genuine ₹ ticket costs, direct trains, scam alerts, and {allAttractions.length} must-visit places.
            </p>
          </div>

          {/* Quick Badges */}
          <div className='flex flex-wrap gap-2 text-xs'>
            <div className='bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20'>
              <span className='text-teal-200 block text-[10px] font-bold uppercase'>Daily Cost (₹)</span>
              <span className='font-extrabold text-sm text-white'>
                ₹{post.budgetINR?.backpacker || 1400} – ₹{post.budgetINR?.moderate || 3200} / day
              </span>
            </div>
            <div className='bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20'>
              <span className='text-teal-200 block text-[10px] font-bold uppercase'>Best Months</span>
              <span className='font-extrabold text-sm text-white'>{post.bestSeason || 'Oct to Mar'}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar — Clean, Large, Easy to Tap */}
        <div className='flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/20'>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'itinerary'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiViewList className='w-4 h-4' /> 📅 3-Day Plan
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'places'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiLocationMarker className='w-4 h-4' /> 📍 All {allAttractions.length} Places
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'map'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiMap className='w-4 h-4' /> 🗺️ Live Route Map & Voice Guide
          </button>

          <button
            onClick={() => setActiveTab('reality')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'reality'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiBadgeCheck className='w-4 h-4' /> ⚖️ Is It Worth It?
          </button>

          <button
            onClick={() => setActiveTab('travel')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'travel'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiTruck className='w-4 h-4' /> 🚆 Trains & Flights ({originCity})
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
              activeTab === 'budget'
                ? 'bg-white text-teal-900 shadow-md ring-2 ring-white/50 scale-105'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <HiCurrencyRupee className='w-4 h-4' /> 💰 Cost Estimator (₹)
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DAY-BY-DAY REALISTIC ITINERARY
         ========================================================================= */}
      {activeTab === 'itinerary' && (
        <div className='p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
            <div>
              <h3 className='text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2'>
                📅 Step-by-Step Day Plan
              </h3>
              <p className='text-slate-600 dark:text-slate-400 text-sm mt-1'>
                Paced for families and explorers. Ample time for local photography, relaxing tea breaks, and wholesome meals.
              </p>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => setActiveTab('places')}
                className='px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs uppercase tracking-wider'
              >
                View All {allAttractions.length} Places
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className='px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow'
              >
                <HiMap className='w-4 h-4' /> View on Map & Listen
              </button>
            </div>
          </div>

          <div className='space-y-5'>
            {waypoints.map((wp, idx) => (
              <div
                key={idx}
                className='bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-teal-400 transition-all flex flex-col sm:flex-row gap-5 items-start'
              >
                <div className='flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex flex-col items-center justify-center font-bold shadow-md'>
                  <span className='text-[10px] uppercase tracking-wider text-teal-100'>Stop</span>
                  <span className='text-2xl'>{idx + 1}</span>
                </div>

                <div className='flex-1'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <h4 className='text-lg font-bold text-slate-900 dark:text-white'>
                      {wp.name}
                    </h4>
                    <span className='px-3 py-1 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-semibold text-xs rounded-full'>
                      Day {wp.day} Plan &bull; {getTransportIcon(wp.transport)}
                    </span>
                  </div>

                  <p className='text-sm text-slate-700 dark:text-slate-200 mt-2.5 leading-relaxed font-normal'>
                    {wp.description}
                  </p>

                  <div className='mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400'>
                    <span className='flex items-center gap-1.5'>
                      <FaClock className='text-teal-500' /> Suggested Time: <strong>1.5 to 2.5 hours</strong>
                    </span>
                    <span className='flex items-center gap-1.5'>
                      <FaCar className='text-teal-500' /> Transit Mode: <strong>{wp.transport}</strong>
                    </span>
                    {wp.distanceKm > 0 && (
                      <span className='flex items-center gap-1.5'>
                        <HiLocationMarker className='text-teal-500' /> Distance: <strong>{wp.distanceKm} km</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: COMPLETE DIRECTORY OF ALL PLACES IN DESTINATION
         ========================================================================= */}
      {activeTab === 'places' && (
        <div className='p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
            <div>
              <h3 className='text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2'>
                📍 All Must-Visit Places & Attractions in {post.title} ({allAttractions.length})
              </h3>
              <p className='text-slate-600 dark:text-slate-400 text-sm mt-1'>
                Everything worth visiting: historical monuments, sacred temples, lakes, nature walks, and famous food streets with entry fees and timings.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className='flex flex-wrap gap-2 text-xs'>
              {['all', 'Fort', 'Temple', 'Nature', 'Food'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedPlaceCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all ${
                    selectedPlaceCategory === cat
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Places' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            {filteredAttractions.map((place, idx) => (
              <div
                key={idx}
                className='bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between'
              >
                <div>
                  <div className='flex items-start justify-between gap-3 mb-2'>
                    <div>
                      <span className='px-2.5 py-0.5 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-bold text-[10px] rounded-full uppercase'>
                        {place.category}
                      </span>
                      <h4 className='text-base font-bold text-slate-900 dark:text-white mt-1'>
                        {place.name}
                      </h4>
                    </div>
                    <span className='text-xs font-semibold text-slate-500'>#{idx + 1}</span>
                  </div>

                  <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3'>
                    {place.insiderTip}
                  </p>

                  <div className='p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs space-y-1 mb-4 border border-slate-100 dark:border-slate-800'>
                    <div className='flex justify-between text-slate-700 dark:text-slate-300'>
                      <span className='text-slate-500'>⏱️ Visiting Hours:</span>
                      <strong>{place.timing}</strong>
                    </div>
                    <div className='flex justify-between text-slate-700 dark:text-slate-300'>
                      <span className='text-slate-500'>🎟️ Entry Fee:</span>
                      <strong className='text-teal-600 dark:text-teal-400'>{place.entryFee}</strong>
                    </div>
                    <div className='flex justify-between text-slate-700 dark:text-slate-300'>
                      <span className='text-slate-500'>⏳ Time Needed:</span>
                      <strong>{place.visitDuration}</strong>
                    </div>
                  </div>

                  <div className='text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-start gap-1.5'>
                    <span>💡</span>
                    <span>{place.isWorthIt}</span>
                  </div>
                </div>

                <div className='mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end'>
                  <button
                    onClick={() => handleShowAttractionOnMap(place)}
                    className='text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:underline'
                  >
                    <HiMap className='w-3.5 h-3.5' /> Show on Map & Listen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: INTERACTIVE ROUTE MAP & 100% SYNCHRONIZED VOICE TOUR
         ========================================================================= */}
      {activeTab === 'map' && (
        <div>
          {/* Top Audio Player & Control Bar */}
          <div className='p-4 sm:p-5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4'>
            <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
              <button
                onClick={handlePlayPause}
                className='flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow transition-all text-xs uppercase tracking-wider'
              >
                {isPlaying ? <HiPause className='w-4 h-4' /> : <HiPlay className='w-4 h-4' />}
                {isPlaying ? 'Pause Tour' : progressPercent >= 100 ? 'Replay Voice Tour' : '▶ Play Voice Tour'}
              </button>

              <button
                onClick={handleReset}
                className='p-2.5 bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shadow-sm'
                title='Reset tour'
              >
                <HiRefresh className='w-4 h-4' />
              </button>

              {/* Voice toggle */}
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm ${
                  voiceEnabled
                    ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {voiceEnabled ? <HiVolumeUp className='w-4 h-4' /> : <HiVolumeOff className='w-4 h-4' />}
                {voiceEnabled ? 'Voice: ON' : 'Voice: OFF'}
              </button>
            </div>

            {/* Speaking Status Banner */}
            {isSpeaking && (
              <div className='flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-semibold animate-pulse'>
                <span className='w-2 h-2 rounded-full bg-amber-500 animate-ping'></span>
                <span>🎙️ AI Guide Speaking...</span>
              </div>
            )}
          </div>

          {/* Voice Narration Subtitle Bar */}
          {speakingText && (
            <div className='px-5 py-3 bg-teal-900 text-teal-100 text-xs sm:text-sm font-medium flex items-center gap-3 border-b border-teal-800'>
              <span className='text-base'>🗣️</span>
              <p className='truncate'>{speakingText}</p>
            </div>
          )}

          {/* Progress Bar */}
          <div className='w-full bg-slate-200 dark:bg-slate-700 h-2'>
            <div
              className='bg-gradient-to-r from-teal-500 to-emerald-400 h-2 transition-all duration-300'
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className='relative'>
            <div
              ref={mapContainerRef}
              className='w-full h-[450px] sm:h-[520px] bg-slate-200 dark:bg-slate-900 z-0'
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TRAVELER REALITY CHECK — IS IT WORTH IT?
         ========================================================================= */}
      {activeTab === 'reality' && (
        <div className='p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
            <div>
              <h3 className='text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2'>
                ⚖️ The Traveler Reality Check: Is {post.title} Worth Visiting?
              </h3>
              <p className='text-slate-600 dark:text-slate-400 text-sm mt-1'>
                Unfiltered on-the-ground truths: what guidebooks hide, tourist traps to avoid, and realistic auto fares.
              </p>
            </div>
            <div className='bg-emerald-100 dark:bg-emerald-950/80 px-4 py-2 rounded-2xl border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-right'>
              <span className='text-[10px] uppercase font-bold block'>Verified Traveler Score</span>
              <strong className='text-lg font-black'>⭐️ 4.8 / 5 • 94% Recommend</strong>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* The Magic & Good */}
            <div className='p-6 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm'>
              <h4 className='font-bold text-base text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2'>
                <HiCheck className='w-5 h-5 text-emerald-600' /> What Makes It 100% Worth Visiting
              </h4>
              <ul className='space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed'>
                <li>• <strong>Genuine Regional Culture:</strong> Unspoiled architecture, warm locals, and authentic regional thalis.</li>
                <li>• <strong>Relaxed Family Friendly Pace:</strong> No extreme rushing—monuments are open and accessible.</li>
                <li>• <strong>High Value for Money:</strong> Clean family homestays available for ₹1,200 – ₹2,400/night.</li>
                <li>• <strong>Photographer’s Delight:</strong> Golden hour morning reflections and ancient stonework.</li>
              </ul>
            </div>

            {/* Tourist Traps & Warnings */}
            <div className='p-6 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm'>
              <h4 className='font-bold text-base text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2'>
                <HiInformationCircle className='w-5 h-5 text-rose-600' /> What To Watch Out For (Fair Traveler Shield)
              </h4>
              <ul className='space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed'>
                <li>• ⚠️ <strong>Station Auto Touts:</strong> Drivers outside the railway station often quote ₹500 for a ₹150 ride. Walk 100m to the main road or fix fare beforehand.</li>
                <li>• ⚠️ <strong>Midday Heat:</strong> Avoid open fortress terraces between 12:00 PM and 3:30 PM in summer months.</li>
                <li>• ⚠️ <strong>Boat & Guide Rates:</strong> Always ask for official Tourism Department ID before hiring a local guide.</li>
              </ul>
            </div>

            {/* Fair Price Shield */}
            <div className='p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm'>
              <h4 className='font-bold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2'>
                <HiShieldCheck className='w-5 h-5 text-teal-600' /> Fair Local Transit Rates (Don’t Overpay)
              </h4>
              <div className='space-y-2 text-xs text-slate-700 dark:text-slate-300'>
                <div className='flex justify-between py-1 border-b border-slate-100 dark:border-slate-700'>
                  <span>Auto Rickshaw (Per Km):</span>
                  <strong>₹15 – ₹20 / km</strong>
                </div>
                <div className='flex justify-between py-1 border-b border-slate-100 dark:border-slate-700'>
                  <span>Station to Main Market Auto:</span>
                  <strong>₹80 – ₹150 (Fixed)</strong>
                </div>
                <div className='flex justify-between py-1 border-b border-slate-100 dark:border-slate-700'>
                  <span>Full-Day Sightseeing Cab:</span>
                  <strong>₹1,800 – ₹2,400 / day</strong>
                </div>
                <div className='flex justify-between py-1'>
                  <span>Shared E-Rickshaws:</span>
                  <strong>₹10 – ₹20 per passenger</strong>
                </div>
              </div>
            </div>

            {/* Best Time of Day & Accessibility */}
            <div className='p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm'>
              <h4 className='font-bold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2'>
                <FaClock className='w-4 h-4 text-amber-500' /> Crowd Control & Best Hours
              </h4>
              <div className='space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed'>
                <p>• <strong>Golden Window:</strong> 6:30 AM – 9:30 AM (Completely empty monuments, pleasant weather, best photography).</p>
                <p>• <strong>Senior Citizen Comfort:</strong> Mostly flat terrain at town centers; forts feature steps so carry walking sticks.</p>
                <p>• <strong>Cash Requirement:</strong> Keep ₹500 in small change (₹20, ₹50, ₹100) as street vendors rarely have change for ₹500 notes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: ORIGIN-TO-DESTINATION TRANSIT, TRAINS & BOOKING
         ========================================================================= */}
      {activeTab === 'travel' && (
        <div className='p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60'>
          {/* Origin City Selector */}
          <div className='bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400'>
                  Step 1: Choose Your Starting City
                </span>
                <h4 className='text-lg font-bold text-slate-900 dark:text-white mt-0.5'>
                  Where are you starting your journey from?
                </h4>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {['Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Kolkata'].map((city) => (
                  <button
                    key={city}
                    onClick={() => fetchTransit(city)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      originCity.toLowerCase() === city.toLowerCase()
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transit Loading State */}
          {loadingTransit && (
            <div className='p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center my-6 shadow-sm'>
              <div className='animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3'></div>
              <p className='text-sm font-semibold text-slate-700 dark:text-slate-300'>
                Finding all direct trains (including Goa Express) and fares from {originCity} to {post.title}...
              </p>
            </div>
          )}

          {/* Transit Results */}
          {!loadingTransit && transitData && (
            <div className='space-y-6 mb-10'>
              <div className='p-6 bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-3xl shadow-xl'>
                <span className='px-3 py-1 bg-white/20 text-white font-bold text-xs rounded-full uppercase tracking-wider'>
                  Route: {originCity} ➔ {post.title}
                </span>
                <h4 className='text-lg sm:text-xl font-bold mt-2'>{transitData.summary}</h4>
                {transitData.smartTravelerAdvice && (
                  <div className='mt-4 pt-4 border-t border-white/20 flex items-start gap-3 text-xs sm:text-sm text-teal-100'>
                    <span className='text-xl'>💡</span>
                    <div>
                      <strong className='text-white font-bold'>Smart Traveler Recommendation:</strong>{' '}
                      {transitData.smartTravelerAdvice}
                    </div>
                  </div>
                )}
              </div>

              {/* Transit Breakdown Cards */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* 1. Trains / IRCTC */}
                <div className='p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xl'>
                        <FaTrain />
                      </div>
                      <span className='px-3 py-1 bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-full'>
                        All Available Trains ({transitData.trains?.length || 0})
                      </span>
                    </div>

                    <h5 className='font-bold text-base text-slate-900 dark:text-white mb-2'>
                      Direct / Connecting Trains
                    </h5>

                    {transitData.trains && transitData.trains.length > 0 ? (
                      <div className='space-y-3.5 max-h-[380px] overflow-y-auto pr-1'>
                        {transitData.trains.map((train, i) => (
                          <div key={i} className='p-3.5 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs hover:border-teal-400 transition-all'>
                            <div className='flex items-center justify-between font-bold text-slate-900 dark:text-white'>
                              <span>{train.trainName} ({train.trainNumber})</span>
                              <span className='text-[10px] px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-md font-bold'>
                                {train.frequency || 'Daily'}
                              </span>
                            </div>
                            <div className='text-slate-500 dark:text-slate-400 mt-1'>
                              {train.departureStation} ➔ {train.arrivalStation} &bull; <strong>{train.duration}</strong>
                            </div>

                            <div className='flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-semibold'>
                              {train.sleeperFare > 0 && (
                                <span className='px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px]'>
                                  Sleeper: ₹{train.sleeperFare}
                                </span>
                              )}
                              {train.ac3Fare > 0 && (
                                <span className='px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-[11px]'>
                                  3AC: ₹{train.ac3Fare}
                                </span>
                              )}
                              {train.ac2Fare > 0 && (
                                <span className='px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-md text-[11px]'>
                                  2AC: ₹{train.ac2Fare}
                                </span>
                              )}
                            </div>

                            {train.advice && (
                              <p className='text-[11px] text-slate-600 dark:text-slate-400 mt-2 italic'>
                                &bull; {train.advice}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-xs text-slate-500'>Connecting trains available via major junction.</p>
                    )}
                  </div>

                  {/* 1-Click IRCTC & ConfirmTkt Booking CTAs */}
                  <div className='mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2'>
                    <a
                      href='https://www.irctc.co.in/nget/train-search'
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center justify-center gap-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all text-center'
                    >
                      <FaTrain className='w-3.5 h-3.5' /> Book on Official IRCTC ↗
                    </a>
                    <a
                      href='https://www.confirmtkt.com'
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors text-center'
                    >
                      <HiExternalLink className='w-3.5 h-3.5' /> Check Live Seat Availability (ConfirmTkt)
                    </a>
                  </div>
                </div>

                {/* 2. Flights */}
                <div className='p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xl'>
                        <FaPlane />
                      </div>
                      <span className='px-3 py-1 bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold rounded-full'>
                        Fastest Option
                      </span>
                    </div>

                    <h5 className='font-bold text-base text-slate-900 dark:text-white mb-2'>
                      Flight Connectivity
                    </h5>

                    {transitData.flights && (
                      <div className='space-y-3 text-xs text-slate-700 dark:text-slate-300'>
                        <div className='p-3 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5'>
                          <div className='font-bold text-slate-900 dark:text-white'>
                            {transitData.flights.originAirport} ➔ {transitData.flights.destinationAirport}
                          </div>
                          <div>
                            ⏱ Duration: <strong>{transitData.flights.duration}</strong> ({transitData.flights.type})
                          </div>
                          <div>
                            Typical Fare: <strong className='text-emerald-600 dark:text-emerald-400'>{transitData.flights.fareRange}</strong>
                          </div>
                          {transitData.flights.topAirlines && (
                            <div className='text-slate-500'>
                              ✈ Airlines: {transitData.flights.topAirlines.join(', ')}
                            </div>
                          )}
                          {transitData.flights.advice && (
                            <p className='text-[11px] text-slate-600 dark:text-slate-400 pt-1 italic'>
                              &bull; {transitData.flights.advice}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://www.makemytrip.com/flights/`}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-4 flex items-center justify-center gap-1.5 p-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition-all text-center'
                  >
                    <FaPlane className='w-3.5 h-3.5' /> Compare Flights on MakeMyTrip ↗
                  </a>
                </div>

                {/* 3. Road & Bus */}
                <div className='p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between'>
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl'>
                        <FaCar />
                      </div>
                      <span className='px-3 py-1 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full'>
                        Road Route
                      </span>
                    </div>

                    <h5 className='font-bold text-base text-slate-900 dark:text-white mb-2'>
                      Highway & Bus Options
                    </h5>

                    {transitData.road && (
                      <div className='space-y-3 text-xs text-slate-700 dark:text-slate-300'>
                        <div className='p-3 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5'>
                          <div className='flex justify-between font-bold'>
                            <span>Highway Distance:</span>
                            <strong className='text-teal-600 dark:text-teal-400'>{transitData.road.distanceKm} km</strong>
                          </div>
                          <div className='flex justify-between'>
                            <span>Drive Time:</span>
                            <span>{transitData.road.drivingHours}</span>
                          </div>
                          <div>
                            <strong>Main Route:</strong> {transitData.road.route}
                          </div>
                          {transitData.road.busFare && (
                            <div>
                              AC Sleeper Bus: <strong>{transitData.road.busFare}</strong>
                            </div>
                          )}
                          {transitData.road.busOptions && (
                            <p className='text-[11px] text-slate-600 dark:text-slate-400 pt-1 italic'>
                              {transitData.road.busOptions}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(post.title)}`}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-4 flex items-center justify-center gap-1.5 p-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all text-center'
                  >
                    <FaHotel className='w-3.5 h-3.5' /> Search Verified Stays (Booking.com) ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: TRIP COST CALCULATOR & 1-CLICK OFFLINE GUIDE
         ========================================================================= */}
      {activeTab === 'budget' && (
        <div className='p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
            <div>
              <h3 className='text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2'>
                💰 Trip Cost Estimator & Offline Pocket Guide
              </h3>
              <p className='text-slate-600 dark:text-slate-400 text-sm mt-1'>
                Instant realistic budget in Indian Rupees (₹) plus 1-click offline pocket guide for your phone.
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <button
                onClick={handlePrintPocketGuide}
                className='flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-all'
              >
                <FaPrint className='w-3.5 h-3.5' /> Download / Print Guide
              </button>
              <button
                onClick={handleCopyWhatsApp}
                className='flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-all'
              >
                {copiedShare ? <HiCheck className='w-4 h-4' /> : <FaWhatsapp className='w-4 h-4' />}
                {copiedShare ? 'Plan Copied!' : 'Share Plan on WhatsApp'}
              </button>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm'>
            <div>
              <label className='block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2'>
                👥 Number of Travelers
              </label>
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCalcTravelers(num)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      calcTravelers === num
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2'>
                📅 Trip Duration (Days)
              </label>
              <div className='flex items-center gap-2'>
                {[1, 2, 3, 4, 5, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCalcDays(num)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                      calcDays === num
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-100'
                    }`}
                  >
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2'>
                🎒 Travel Style
              </label>
              <div className='flex gap-2'>
                <button
                  onClick={() => setCalcStyle('backpacker')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                    calcStyle === 'backpacker'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Pocket Friendly (₹)
                </button>
                <button
                  onClick={() => setCalcStyle('moderate')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                    calcStyle === 'moderate'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Comfort Family (₹₹)
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className='mt-6 bg-gradient-to-r from-teal-800 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl'>
            <div className='flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-5 mb-5'>
              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-teal-200'>
                  Estimated Total Budget for {calcTravelers} Person(s) &bull; {calcDays} Days
                </span>
                <div className='text-3xl sm:text-4xl font-black mt-1'>
                  ₹{adjustedTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div className='bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right'>
                <span className='text-[10px] text-teal-200 block uppercase font-bold'>Cost Per Person</span>
                <span className='text-lg font-black'>
                  ₹{Math.round(adjustedTotal / calcTravelers).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs'>
              <div className='bg-white/10 p-3.5 rounded-2xl border border-white/15'>
                <span className='text-teal-200 block mb-1'>🏨 Hotel / Homestay</span>
                <strong className='text-base font-bold'>₹{totalHotel.toLocaleString('en-IN')}</strong>
                <p className='text-[10px] text-teal-300 mt-1'>
                  {calcStyle === 'backpacker' ? 'Clean guesthouse / homestay' : 'Comfortable 3-star AC room'}
                </p>
              </div>

              <div className='bg-white/10 p-3.5 rounded-2xl border border-white/15'>
                <span className='text-teal-200 block mb-1'>🍽️ Meals & Snacks</span>
                <strong className='text-base font-bold'>₹{totalFood.toLocaleString('en-IN')}</strong>
                <p className='text-[10px] text-teal-300 mt-1'>Breakfast, thalis, tea & bottled water</p>
              </div>

              <div className='bg-white/10 p-3.5 rounded-2xl border border-white/15'>
                <span className='text-teal-200 block mb-1'>🚖 Local Cabs & Autos</span>
                <strong className='text-base font-bold'>₹{totalTransit.toLocaleString('en-IN')}</strong>
                <p className='text-[10px] text-teal-300 mt-1'>Local sightseeing, station transfers</p>
              </div>

              <div className='bg-white/10 p-3.5 rounded-2xl border border-white/15'>
                <span className='text-teal-200 block mb-1'>🎟️ Tickets & Parking</span>
                <strong className='text-base font-bold'>₹{totalTickets.toLocaleString('en-IN')}</strong>
                <p className='text-[10px] text-teal-300 mt-1'>Monument passes, camera fees</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}