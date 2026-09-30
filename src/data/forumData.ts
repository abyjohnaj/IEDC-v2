import { ForumDiscussion } from '../types';

export const initialForumDiscussions: ForumDiscussion[] = [
  {
    id: "thread-1",
    authorName: "Ivin Saji",
    authorRole: "Student Lead • S7 CSE",
    authorAvatar: "https://iedcwebsite.web.app/assets/ivin.png",
    fallbackAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    channel: "TeamUp",
    title: "Building 'EcoCharge' - IoT Smart EV Charging Station. Looking for 2 Developers!",
    excerpt: "We are developing an affordable smart EV charger prototype for college campuses funded under KSUM pre-seed grant. We need 1 Flutter App Dev & 1 Embedded C/ESP32 Engineer.",
    rolesNeeded: ["Flutter App Developer", "Embedded C / ESP32 Hardware"],
    timestamp: "2 hours ago",
    upvotes: 24,
    comments: [
      {
        author: "Aaron Panicker",
        avatar: "https://iedcwebsite.web.app/assets/Aaron.JPG",
        time: "1 hour ago",
        text: "Sounds awesome Ivin! I can handle the Flutter mobile app UI design and Bluetooth pairing screens."
      },
      {
        author: "Dr. Sreekanth S.",
        avatar: "https://iedcwebsite.web.app/assets/sreekanthsir.jpeg",
        time: "30 mins ago",
        text: "Good initiative. You can access the ESP32 breakout boards and relay modules in the IEDC Hardware Lab anytime."
      }
    ]
  },
  {
    id: "thread-2",
    authorName: "Gouri Krishna",
    authorRole: "Student Lead • S7 ECE",
    authorAvatar: "https://iedcwebsite.web.app/assets/Gouri.JPG",
    fallbackAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    channel: "IdeaPitch",
    title: "Idea Feedback: Automated Agri-Drone for Crop Health Detection in Kerala Paddy Fields",
    excerpt: "Using multispectral camera imaging on low-cost drones to detect early pest infestations in Alappuzha & Kollam paddy farms. Looking for agricultural feedback and AI image dataset support.",
    rolesNeeded: ["Python OpenCV / PyTorch Dev", "Drone Pilot / Operator"],
    timestamp: "5 hours ago",
    upvotes: 38,
    comments: [
      {
        author: "Jeswin Jacob",
        avatar: "https://iedcwebsite.web.app/assets/jeswin.png",
        time: "4 hours ago",
        text: "Great concept! Have you checked KSUM Idea Grant guidelines? Agri-tech startups receive priority funding approval."
      }
    ]
  },
  {
    id: "thread-3",
    authorName: "Vaishnavi S.",
    authorRole: "Operations Lead • S5 EEE",
    authorAvatar: "https://iedcwebsite.web.app/assets/Vaishnavi.JPG",
    fallbackAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    channel: "TechQA",
    title: "How to connect Arduino Nano ESP32 to Firebase Realtime DB without latency spikes?",
    excerpt: "We are building an energy monitoring sensor network for the BMCE campus. We get occasional timeout errors on WiFi reconnect. Any recommended library fixes?",
    rolesNeeded: ["IoT Firmware Dev"],
    timestamp: "1 day ago",
    upvotes: 15,
    comments: [
      {
        author: "Prof. Manoj Kumar",
        avatar: "https://iedcwebsite.web.app/assets/manojsir.JPG",
        time: "18 hours ago",
        text: "Try using MQTT broker bridges with retained messages instead of direct persistent HTTP keep-alive connections."
      }
    ]
  },
  {
    id: "thread-4",
    authorName: "Jeswin Jacob",
    authorRole: "Branding Lead • S7 ME",
    authorAvatar: "https://iedcwebsite.web.app/assets/jeswin.png",
    fallbackAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    channel: "Grants",
    title: "KSUM Idea Grant ₹2 Lakhs applications closing next week. Pitch Deck Review Slot open!",
    excerpt: "The IEDC Nodal desk is hosting pre-pitch reviews this Thursday in the Seminar Hall. Bring your draft pitch decks and financial projections for mentoring.",
    rolesNeeded: ["Pitch Deck Reviewers", "Mentors"],
    timestamp: "2 days ago",
    upvotes: 42,
    comments: []
  },
  {
    id: "thread-5",
    authorName: "Aby John",
    authorRole: "Media Lead • S5 CSE",
    authorAvatar: "https://iedcwebsite.web.app/assets/Aby.jpg",
    fallbackAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    channel: "Showcase",
    title: "Showcase: Smart Waste Segregator with Edge AI camera completed at BMCE FabLab",
    excerpt: "Our team finished the hardware casing and AI classification model capable of sorting dry/wet/plastic waste in under 400ms. Check out the demo video!",
    rolesNeeded: ["Product Designers", "3D Printing Mentors"],
    timestamp: "3 days ago",
    upvotes: 56,
    comments: []
  }
];
