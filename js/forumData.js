/* Community Forum & Collaboration Database */

const initialForumDiscussions = [
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
    rolesNeeded: [],
    timestamp: "1 day ago",
    upvotes: 15,
    comments: [
      {
        author: "Aby John",
        avatar: "https://iedcwebsite.web.app/assets/Aby.jpg",
        time: "20 hours ago",
        text: "Try using Firebase-ESP-Client library by Mobizt with async HTTP client. It fixed our dropouts during EKAH '25."
      }
    ]
  },
  {
    id: "thread-4",
    authorName: "Niranjana Unni",
    authorRole: "Finance Lead • S5 Civil",
    authorAvatar: "https://iedcwebsite.web.app/assets/Niranjana.JPG",
    fallbackAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    channel: "Grants",
    title: "KSUM Idea Grant 2026 Phase 1 Applications Open! Step-by-Step Guide",
    excerpt: "Student startups can apply for grants up to ₹2 Lakhs. Here is the checklist of required documents: Pitch deck PDF, Institution NOC from IEDC BMCE, and Prototyping estimate.",
    rolesNeeded: [],
    timestamp: "2 days ago",
    upvotes: 42,
    comments: [
      {
        author: "Prof. Manoj Kumar",
        avatar: "https://iedcwebsite.web.app/assets/manojsir.JPG",
        time: "1 day ago",
        text: "All students submitting applications must get their pitch decks reviewed by IEDC Nodal Officers by Friday."
      }
    ]
  },
  {
    id: "thread-5",
    authorName: "Aaron Panicker",
    authorRole: "Creative Lead • S5 Mech",
    authorAvatar: "https://iedcwebsite.web.app/assets/Aaron.JPG",
    fallbackAvatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80",
    channel: "Showcase",
    title: "Showcase: 'CampusRover' - Automated Document Delivery Robot Built in BMCE Maker Space",
    excerpt: "Successfully completed test runs delivering intra-departmental mail between Principal Office and CSE Department! Powered by ROS2 and LiDAR sensors.",
    rolesNeeded: [],
    timestamp: "3 days ago",
    upvotes: 56,
    comments: [
      {
        author: "Anupa Alex",
        avatar: "https://iedcwebsite.web.app/assets/anupa.jpg",
        time: "2 days ago",
        text: "Super cool demo video! Let's submit this for the upcoming Inter-College Innovators Expo."
      }
    ]
  }
];
