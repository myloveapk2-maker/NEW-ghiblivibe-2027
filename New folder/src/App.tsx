/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, limit, getDocs, where } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { GoogleGenAI } from "@google/genai";
import { auth, db, googleProvider, messaging } from './firebase';
import { Copy, Check, Download, ExternalLink, Code, LayoutGrid, Info, Search, Bell, MessageCircle, User, ChevronRight, Heart, Share2, MessageSquare, Palette, LogIn, LogOut, UserPlus, Phone, Settings, X, Bookmark, Trash2, Shield, RefreshCw, Flag, AlertTriangle } from 'lucide-react';
import { BLOGGER_XML_TEMPLATE } from './BloggerTemplate';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mock data for the preview
const MOCK_POSTS = [
  { id: 1, title: "Spirited Away Aesthetics", image: "https://picsum.photos/seed/spirited/400/600", category: "Spirited Away", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 2, title: "My Neighbor Totoro Forest", image: "https://picsum.photos/seed/totoro/400/400", category: "Totoro", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 3, title: "Howl's Moving Castle Interior", image: "https://picsum.photos/seed/howl/400/700", category: "Howl's Castle", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 4, title: "Princess Mononoke Nature", image: "https://picsum.photos/seed/mononoke/400/500", category: "Mononoke", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 5, title: "Kiki's Delivery Service Bakery", image: "https://picsum.photos/seed/kiki/400/650", category: "Kiki's Delivery", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 6, title: "Ponyo Under the Sea", image: "https://picsum.photos/seed/ponyo/400/450", category: "Ponyo", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 7, title: "The Wind Rises Sky", image: "https://picsum.photos/seed/wind/400/800", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 8, title: "Castle in the Sky Ruins", image: "https://picsum.photos/seed/laputa/400/550", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 9, title: "Porco Rosso Beach", image: "https://picsum.photos/seed/porco/400/400", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 10, title: "Whisper of the Heart Library", image: "https://picsum.photos/seed/whisper/400/600", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 11, title: "The Secret World of Arrietty", image: "https://picsum.photos/seed/arrietty/400/700", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 12, title: "When Marnie Was There", image: "https://picsum.photos/seed/marnie/400/500", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 13, title: "Ancient Forest Spirits", image: "https://picsum.photos/seed/forestSpirit/400/500", category: "Mononoke", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 14, title: "Emerald Canopy", image: "https://picsum.photos/seed/canopy/400/400", category: "Totoro", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 15, title: "Sun-dappled Glen", image: "https://picsum.photos/seed/glen/400/600", category: "Aesthetics", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 16, title: "Mossy Stone Path", image: "https://picsum.photos/seed/mossPath/400/700", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 17, title: "Whispering Bamboo Grove", image: "https://picsum.photos/seed/bamboo/400/450", category: "Aesthetics", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 18, title: "The Great Forest King", image: "https://picsum.photos/seed/forestKing/400/800", category: "Mononoke", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 19, title: "Chihiro's Determination", image: "https://picsum.photos/seed/chihiroPort/400/400", category: "Spirited Away", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 20, title: "Howl's Transformation", image: "https://picsum.photos/seed/howlPort/400/550", category: "Howl's Castle", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 21, title: "Sophie's Kindness", image: "https://picsum.photos/seed/sophie/400/600", category: "Howl's Castle", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 22, title: "San the Wolf Princess", image: "https://picsum.photos/seed/sanPort/400/700", category: "Mononoke", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 23, title: "Kiki's First Flight", image: "https://picsum.photos/seed/kikiFlight/400/450", category: "Kiki's Delivery", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 24, title: "Ponyo's Joy", image: "https://picsum.photos/seed/ponyoJoy/400/500", category: "Ponyo", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 25, title: "Ashitaka's Journey", image: "https://picsum.photos/seed/ashitaka/400/600", category: "Mononoke", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 26, title: "The Boiler Room", image: "https://picsum.photos/seed/kamaji/400/400", category: "Spirited Away", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 27, title: "Howl's Bedroom Magic", image: "https://picsum.photos/seed/howlRoom/400/800", category: "Howl's Castle", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 28, title: "Kiki's Attic Room", image: "https://picsum.photos/seed/kikiRoom/400/700", category: "Kiki's Delivery", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 29, title: "Tea Time at Zeniba's", image: "https://picsum.photos/seed/zeniba/400/500", category: "Spirited Away", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
  { id: 30, title: "Afternoon at the Bakery", image: "https://picsum.photos/seed/bakery/400/600", category: "Kiki's Delivery", authorId: "ghibli_artist_2", authorName: "Studio Fan" },
  { id: 31, title: "Cozy Living Room", image: "https://picsum.photos/seed/livingRoom/400/450", category: "Aesthetics", authorId: "ghibli_artist_3", authorName: "Nature Enthusiast" },
  { id: 32, title: "Library of Dreams", image: "https://picsum.photos/seed/library/400/800", category: "Aesthetics", authorId: "ghibli_artist_1", authorName: "Ghibli Artist" },
];

const CATEGORIES = ["All", "AI Generated", "Spirited Away", "Totoro", "Howl's Castle", "Kiki's Delivery", "Mononoke", "Ponyo", "Aesthetics"];

const EXPLORE_TOPICS = [
  { name: "Wallpapers", image: "https://picsum.photos/seed/ghibli1/300/200" },
  { name: "Characters", image: "https://picsum.photos/seed/ghibli2/300/200" },
  { name: "Scenery", image: "https://picsum.photos/seed/ghibli3/300/200" },
  { name: "Fan Art", image: "https://picsum.photos/seed/ghibli4/300/200" },
  { name: "Quotes", image: "https://picsum.photos/seed/ghibli5/300/200" },
];

const PROMPT_TEMPLATES = [
  { name: "Floating Island", prompt: "A lush floating island with cascading waterfalls and ancient ruins" },
  { name: "Secret Forest", prompt: "A dense, glowing forest with tiny spirits peeking from behind giant mushrooms" },
  { name: "Sky Train", prompt: "A vintage train traveling across a sea of clouds during a golden sunset" },
  { name: "Cozy Cottage", prompt: "A small cottage nestled in a valley of blooming wildflowers, smoke rising from the chimney" },
  { name: "Robot Friend", prompt: "A giant, moss-covered robot sitting in a meadow, holding a single small flower" },
  { name: "Underwater City", prompt: "A bioluminescent city under the sea with giant jellyfish and coral skyscrapers" },
  { name: "Starry Night", prompt: "A quiet village under a swirling, magical starry sky with shooting stars" },
];

const SkeletonCard = ({ index = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
    className="grid-item w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6 p-1.5 sm:p-2"
  >
    <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  </motion.div>
);

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }: any) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ReportModal = ({ target, targetType, onClose, onReport, isSubmitting }: any) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const reasons = [
    "Spam",
    "Inappropriate content",
    "Harassment",
    "Hate speech",
    "Copyright violation",
    "Fake information",
    "Other"
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 pb-0 flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Flag className="text-red-600" size={24} />
            Report {targetType === 'post' ? 'Post' : 'User'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 pt-0 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-gray-500 mb-6">
            Help us understand what's wrong. Your report is anonymous unless it's a copyright claim.
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Reason</label>
              <div className="grid grid-cols-1 gap-2">
                {reasons.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all border ${
                      reason === r 
                        ? 'bg-red-50 border-red-600 text-red-600 shadow-sm' 
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide more context..."
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-100 focus:bg-white transition-all outline-none resize-none h-24"
              />
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 flex gap-4 border-t border-gray-50 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-transparent text-gray-400 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!reason || isSubmitting}
            onClick={() => onReport({ reason, details, targetId: target.id, targetType })}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all ${
              !reason || isSubmitting 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UserPopover = ({ authorId, authorName, authorPhoto, followersCount, isFollowing, onFollow, currentUser, bio, onViewProfile }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute bottom-full left-0 mb-4 bg-white rounded-3xl shadow-2xl p-6 w-64 z-[200] border border-gray-50 text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-red-100 overflow-hidden shrink-0">
          <img 
            src={authorPhoto || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} 
            alt={authorName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{authorName || 'Ghibli Artist'}</h4>
          <p className="text-xs text-gray-500 font-medium">{followersCount || 0} followers</p>
        </div>
      </div>
      
      {bio && (
        <p className="text-[11px] text-gray-600 mb-4 line-clamp-3 italic leading-relaxed">
          "{bio}"
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewProfile(authorId);
          }}
          className="w-full py-2 rounded-2xl text-xs font-bold bg-gray-50 text-gray-900 hover:bg-gray-100 transition-all border border-gray-100"
        >
          View Full Profile
        </button>
        
        {currentUser?.uid !== authorId && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFollow(authorId);
            }}
            className={`w-full py-2.5 rounded-2xl text-sm font-bold transition-all ${
              isFollowing
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const PostCard = React.memo(({ 
  post, 
  index,
  setSelectedPost, 
  showReactions, 
  setShowReactions, 
  reactions, 
  setReactions, 
  commentInputRef, 
  setShowShare,
  followersCounts,
  following,
  handleFollow,
  user,
  savedPosts,
  handleSavePost,
  userProfile,
  handleDeletePost,
  onViewProfile,
  onReport,
  onDelete
}: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const hoverTimeoutRef = useRef<any>(null);

  // Extract dimensions for aspect ratio to prevent layout shifts
  const dims = post.image.match(/\/(\d+)\/(\d+)$/);
  const width = dims ? parseInt(dims[1]) : 400;
  const height = dims ? parseInt(dims[2]) : 500;
  const aspectRatio = `${width} / ${height}`;

  // Create a low-res blurred version for the loading state
  const lowResImage = post.image.includes('picsum.photos') 
    ? post.image.replace(/\/(\d+)\/(\d+)$/, `/20/${Math.round(20 * (height / width))}?blur=10`)
    : post.image;

  useEffect(() => {
    if (showPopover && post.authorId) {
      const userRef = doc(db, 'users', post.authorId);
      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setAuthorProfile(snapshot.data());
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, userRef.path));

      const followersRef = collection(db, 'users', post.authorId, 'followers');
      const unsubscribeFollowers = onSnapshot(followersRef, (snapshot) => {
        setFollowerCount(snapshot.size);
      }, (error) => handleFirestoreError(error, OperationType.GET, followersRef.path));

      return () => {
        unsubscribeUser();
        unsubscribeFollowers();
      };
    }
  }, [showPopover, post.authorId]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 300);
  };

  return (
    <div className="grid-item w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6 p-1.5 sm:p-2">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1],
          delay: (index % 10) * 0.05
        }}
        className="relative group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
        onClick={() => setSelectedPost(post)}
        role="article"
        aria-label={`Post: ${post.title}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedPost(post);
          }
        }}
      >
        <div className="relative w-full overflow-hidden bg-gray-50">
          {/* Blurred Placeholder */}
          <div 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
            style={{ 
              backgroundImage: `url(${post.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(20px) saturate(1.2)',
              transform: 'scale(1.1)'
            }}
          />
          
          <div className={`w-full transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-sm'}`}>
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-auto block group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
          <div className="h-full flex flex-col justify-center">
            <div className="flex flex-col gap-3">
              <h3 className="text-white font-bold text-lg leading-tight text-center">
                {post.title}
              </h3>
              <div className="flex justify-center gap-2 mt-2 relative">
                <div className="relative">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setShowReactions(showReactions === post.id ? null : post.id);
                    }}
                    className={`w-8 h-8 bg-white rounded-full flex items-center justify-center transition-colors shadow-sm ${reactions[post.id] ? 'text-red-600' : 'text-gray-900 hover:text-red-600'}`}
                    aria-label="React to post"
                    aria-expanded={showReactions === post.id}
                    aria-haspopup="true"
                  >
                    {reactions[post.id] ? (
                      <span className="text-lg font-emoji flex items-center justify-center leading-normal mb-[2px]">{reactions[post.id]}</span>
                    ) : (
                      <Heart size={16} />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showReactions === post.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white px-3 py-2 rounded-[2rem] shadow-xl border border-gray-100 flex flex-wrap justify-center gap-1.5 sm:gap-2 w-max max-w-[280px] sm:max-w-none z-50"
                      >
                        {['❤️', '😂', '😮', '😢', '😡', '🔥', '✨', '👏'].map((emoji, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.3 }}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              setReactions({ ...reactions, [post.id]: emoji });
                              setShowReactions(null);
                            }}
                            className="text-xl font-emoji flex items-center justify-center leading-normal mb-[2px]"
                            aria-label={`React with ${emoji} emoji`}
                          >
                            <span aria-hidden="true">{emoji}</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPost(post);
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-blue-600 transition-colors shadow-sm"
                  aria-label="Comment on post"
                >
                  <MessageSquare size={16} aria-hidden="true" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowShare(post);
                  }}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-green-600 transition-colors shadow-sm"
                  aria-label="Share post"
                >
                  <Share2 size={16} aria-hidden="true" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSavePost(post);
                  }}
                  className={`w-8 h-8 bg-white rounded-full flex items-center justify-center transition-colors shadow-sm ${savedPosts.has(String(post.id)) ? 'text-amber-500' : 'text-gray-900 hover:text-amber-500'}`}
                  aria-label={savedPosts.has(String(post.id)) ? "Remove from saved" : "Save post"}
                  aria-pressed={savedPosts.has(String(post.id))}
                >
                  <Bookmark size={16} fill={savedPosts.has(String(post.id)) ? "currentColor" : "none"} aria-hidden="true" />
                </button>
                {(user?.uid === post.authorId || userProfile?.role === 'admin') && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(post.id);
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-red-600 transition-colors shadow-sm"
                    aria-label="Delete post"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReport(post, 'post');
                  }}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-red-600 transition-colors shadow-sm"
                  aria-label="Report post"
                >
                  <Flag size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="p-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="w-8 h-8 rounded-full bg-red-100 overflow-hidden shrink-0 cursor-pointer"
            onClick={() => onViewProfile(post.authorId)}
          >
            <img 
              src={authorProfile?.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} 
              alt={post.authorName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span 
            className="text-xs font-bold text-gray-700 truncate hover:underline cursor-pointer"
            onClick={() => onViewProfile(post.authorId)}
          >
            {post.authorName || 'Ghibli Artist'}
          </span>
          
                <AnimatePresence>
            {showPopover && (
              <UserPopover 
                authorId={post.authorId}
                authorName={authorProfile?.displayName || post.authorName}
                authorPhoto={authorProfile?.photoURL}
                followersCount={followerCount}
                isFollowing={following.has(post.authorId)}
                onFollow={handleFollow}
                currentUser={user}
                bio={authorProfile?.bio}
                onViewProfile={onViewProfile}
              />
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{post.category}</span>
      </div>
    </div>
  );
});

export default function App() {
  return (
    <AppContent />
  );
}

function Home({ 
  activeCategory, 
  filteredPosts, 
  gridRef, 
  loadMore, 
  loading,
  setSelectedPost,
  showReactions,
  setShowReactions,
  reactions,
  setReactions,
  commentInputRef,
  setShowShare,
  msnryRef,
  followersCounts,
  following,
  handleFollow,
  user,
  savedPosts,
  handleSavePost,
  userProfile,
  handleDeletePost,
  onViewProfile,
  onReport,
  onDelete
}: any) {

  useEffect(() => {
    let msnry: Masonry | null = null;
    
    if (gridRef.current) {
      const imgLoad = imagesLoaded(gridRef.current);
      imgLoad.on('always', () => {
        if (gridRef.current) {
          msnry = new Masonry(gridRef.current, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-item',
            percentPosition: true,
            transitionDuration: '0.3s'
          });
          if (msnryRef) msnryRef.current = msnry;
        }
      });

      imgLoad.on('progress', () => {
        msnry?.layout?.();
      });
    }

    return () => {
      if (msnryRef?.current) {
        msnryRef.current.destroy?.();
        msnryRef.current = null;
      }
    };
  }, [filteredPosts, activeCategory]);

  return (
    <>
      {/* Explore Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Explore Ghibli Vibes</h2>
          <button className="text-sm font-semibold flex items-center gap-1 hover:underline">View all <ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {EXPLORE_TOPICS.map((topic) => (
            <div 
              key={topic.name}
              className="relative h-28 rounded-2xl overflow-hidden cursor-pointer group"
            >
              <img src={topic.image} alt={topic.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{topic.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{activeCategory === "All" ? "Recent Discoveries" : activeCategory}</h2>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="w-full -mx-2">
        {filteredPosts.length === 0 && loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} index={i} />)
        ) : (
          <>
            {filteredPosts.map((post: any, index: number) => (
              <PostCard 
                key={post.id}
                post={post}
                index={index}
                setSelectedPost={setSelectedPost}
                showReactions={showReactions}
                setShowReactions={setShowReactions}
                reactions={reactions}
                setReactions={setReactions}
                commentInputRef={commentInputRef}
                setShowShare={setShowShare}
                followersCounts={followersCounts}
                following={following}
                handleFollow={handleFollow}
                user={user}
                savedPosts={savedPosts}
                handleSavePost={handleSavePost}
                userProfile={userProfile}
                handleDeletePost={handleDeletePost}
                onViewProfile={onViewProfile}
                onReport={onReport}
                onDelete={onDelete}
              />
            ))}
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} index={i + filteredPosts.length} />)}
          </>
        )}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No posts found matching your criteria.</p>
        </div>
      )}
    </>
  );
}

const AuthorProfileModal = ({ author, posts, isLoading, onClose, onFollow, isFollowing, followersCount, currentUser, setSelectedPost, onReport }: any) => {
  if (!author) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-red-100 overflow-hidden shrink-0 shadow-lg border-4 border-white">
            <img 
              src={author.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} 
              alt={author.displayName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h2 className="text-3xl font-black text-gray-900">{author.displayName || 'Ghibli Artist'}</h2>
              <div className="flex items-center gap-3">
                {currentUser?.uid !== author.id && (
                  <button 
                    onClick={() => onFollow(author.id)}
                    className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {currentUser?.uid !== author.id && (
                  <button 
                    onClick={() => onReport(author, 'user')}
                    className="p-2.5 rounded-full bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-100"
                    title="Report User"
                  >
                    <Flag size={20} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-center md:justify-start gap-8 mb-4">
              <div className="text-center md:text-left">
                <p className="text-xl font-black text-gray-900">{posts.length}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Posts</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xl font-black text-gray-900">{followersCount || 0}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Followers</p>
              </div>
            </div>
            {author.bio && (
              <p className="text-gray-600 text-sm italic leading-relaxed max-w-xl">
                "{author.bio}"
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Posts Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {posts.map((post: any) => (
                <div 
                  key={post.id} 
                  className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer"
                  onClick={() => {
                    setSelectedPost(post);
                    onClose();
                  }}
                >
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <p className="text-white text-[10px] font-bold text-center line-clamp-2">{post.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Palette size={32} />
              </div>
              <p className="text-gray-500 font-medium">No posts yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

function AppContent() {
  const gridRef = useRef<HTMLDivElement>(null);
  const msnryRef = useRef<Masonry | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [bioInput, setBioInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showShare, setShowShare] = useState<any>(null);
  const [showReactions, setShowReactions] = useState<number | null>(null);
  const [reactions, setReactions] = useState<{[key: number]: string}>({});
  const [commentText, setCommentText] = useState("");
  const [postComments, setPostComments] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followersCounts, setFollowersCounts] = useState<{[key: string]: number}>({});
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showRecommend, setShowRecommend] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [savedPostsData, setSavedPostsData] = useState<any[]>([]);
  const [profileTab, setProfileTab] = useState<'settings' | 'saved' | 'admin'>('settings');
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'reports'>('users');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [viewingAuthor, setViewingAuthor] = useState<any>(null);
  const [authorPosts, setAuthorPosts] = useState<any[]>([]);
  const [isLoadingAuthorPosts, setIsLoadingAuthorPosts] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [aiAspectRatio, setAiAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [aiStyle, setAiStyle] = useState<string>("Ghibli");
  const [aiResolution, setAiResolution] = useState<"Standard" | "High" | "4K" | "8K">("Standard");
  const [aiModalTab, setAiModalTab] = useState<'prompt' | 'settings' | 'inspiration'>('prompt');
  const [activeView, setActiveView] = useState<'Home' | 'Following' | 'Gallery'>('Home');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [aiInspirationImage, setAiInspirationImage] = useState<string | null>(null);
  const [aiImageInfluence, setAiImageInfluence] = useState<number>(0.5);
  const [reportTarget, setReportTarget] = useState<any>(null);
  const [reportTargetType, setReportTargetType] = useState<'post' | 'user' | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (user && messaging) {
      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Note: In a real environment, you would use your VAPID key from Firebase Console
            // getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' })
            const token = await getToken(messaging).catch(err => {
              console.warn("Could not get FCM token (likely missing VAPID key or service worker issue):", err);
              return null;
            });
            
            if (token) {
              setFcmToken(token);
              await updateDoc(doc(db, 'users', user.uid), {
                fcmToken: token,
                notificationsEnabled: true
              });
            }
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      };

      requestPermission();

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        if (payload.notification) {
          // Foreground notifications are handled by the browser if permission is granted
          // but we can also show a custom UI toast here if needed.
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notifs);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users/' + user.uid + '/notifications'));
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const savedRef = collection(db, 'users', user.uid, 'saved');
      const unsubscribe = onSnapshot(savedRef, (snapshot) => {
        const ids = new Set(snapshot.docs.map(doc => doc.id));
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setSavedPosts(ids);
        setSavedPostsData(data);
      }, (error) => handleFirestoreError(error, OperationType.GET, savedRef.path));
      return () => unsubscribe();
    } else {
      setSavedPosts(new Set());
      setSavedPostsData([]);
    }
  }, [user]);

  const handleSavePost = async (post: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isSaved = savedPosts.has(String(post.id));
    const savedDocRef = doc(db, 'users', user.uid, 'saved', String(post.id));

    try {
      if (isSaved) {
        await deleteDoc(savedDocRef);
      } else {
        await setDoc(savedDocRef, {
          ...post,
          savedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleOpenReport = (target: any, type: 'post' | 'user') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setReportTarget(target);
    setReportTargetType(type);
  };

  const handleSubmitReport = async (reportData: any) => {
    if (!user) return;
    setIsSubmittingReport(true);
    try {
      const reportRef = collection(db, 'reports');
      await addDoc(reportRef, {
        ...reportData,
        reporterId: user.uid,
        reporterName: userProfile?.displayName || user.displayName || 'Anonymous',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      // Use temporary recommendation state for success feedback
      // We'll use a specific state for toast if we want, but since showRecommend is there, let's use a simpler way or just reset.
      // Actually, let's add a proper toast state.
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 5000);
      setReportTarget(null);
      setReportTargetType(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const fetchReports = async () => {
    if (userProfile?.role !== 'admin') return;
    setIsLoadingReports(true);
    try {
      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
      const reportsData = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      setAllReports(allReports.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  useEffect(() => {
    if (profileTab === 'admin') {
      fetchReports();
    }
  }, [profileTab, userProfile]);

  const handleGenerateAIImage = async (mode: 'upload' | 'create' = 'upload') => {
    if (!aiPrompt?.trim()) return;
    
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      // Enhance prompt based on selected style
      let styleDescriptor = "Studio Ghibli style, hand-drawn aesthetic, soft watercolor textures, vibrant colors, whimsical atmosphere, high detail, masterpiece";
      if (aiStyle === "Watercolor") {
        styleDescriptor = "watercolor painting style, soft bleeding edges, textured paper, artistic, delicate washes, masterpiece";
      } else if (aiStyle === "Oil Painting") {
        styleDescriptor = "oil painting style, thick brushstrokes, impasto, rich textures, classical art, masterpiece";
      } else if (aiStyle === "Sketch") {
        styleDescriptor = "pencil sketch style, graphite textures, hand-drawn, artistic shading, detailed linework, masterpiece";
      } else if (aiStyle === "Cyberpunk") {
        styleDescriptor = "cyberpunk style, neon lights, high tech, futuristic, dark atmosphere, vibrant glows, masterpiece";
      } else if (aiStyle === "Anime") {
        styleDescriptor = "modern anime style, clean lines, vibrant colors, expressive characters, high quality anime art, masterpiece";
      } else if (aiStyle === "Impressionism") {
        styleDescriptor = "impressionist painting style, visible brushstrokes, emphasis on light and its changing qualities, ordinary subject matter, movement, masterpiece";
      } else if (aiStyle === "Abstract") {
        styleDescriptor = "abstract art style, non-representational, geometric shapes, bold colors, expressive forms, artistic, masterpiece";
      } else if (aiStyle === "Fantasy") {
        styleDescriptor = "epic fantasy style, magical atmosphere, mythical creatures, ornate details, glowing elements, legendary, masterpiece";
      } else if (aiStyle === "Sci-Fi") {
        styleDescriptor = "science fiction style, advanced technology, interstellar environments, sleek metallic surfaces, neon accents, futuristic, masterpiece";
      } else if (aiStyle === "Minimalist") {
        styleDescriptor = "minimalist art style, clean lines, simple forms, limited color palette, negative space, elegant, masterpiece";
      }
      
      let resolutionDescriptor = "high quality";
      if (aiResolution === "High") {
        resolutionDescriptor = "ultra high resolution, extremely detailed, sharp focus, professional quality";
      } else if (aiResolution === "4K") {
        resolutionDescriptor = "4k resolution, cinematic lighting, photorealistic details, hyper-realistic textures, masterpiece";
      } else if (aiResolution === "8K") {
        resolutionDescriptor = "8k resolution, ultimate detail, microscopic precision, flawless textures, breathtaking clarity, masterpiece";
      }
      
      const enhancedPrompt = `${styleDescriptor}, ${resolutionDescriptor}: ${aiPrompt}`;
      
      const parts: any[] = [{ text: enhancedPrompt }];
      
      if (aiInspirationImage) {
        const base64Data = aiInspirationImage.split(',')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/png"
          }
        });
        // Add influence context to prompt
        parts[0].text += ` (Inspiration influence: ${Math.round(aiImageInfluence * 100)}%)`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: aiAspectRatio,
          },
        },
      });

      let generatedBase64 = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedBase64) {
        if (mode === 'upload') {
          setUploadImagePreview(generatedBase64);
          setShowAIGenerator(false);
          
          // Default category to AI Generated
          setTimeout(() => {
            const categorySelect = document.getElementById('post-category') as HTMLSelectElement;
            if (categorySelect) {
              categorySelect.value = "AI Generated";
            }
          }, 0);
        } else {
          setAiGeneratedImage(generatedBase64);
        }
      } else {
        alert("Failed to generate image. Please try a different prompt.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("An error occurred during AI generation. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleViewAuthorProfile = async (authorId: string) => {
    setIsLoadingAuthorPosts(true);
    try {
      // Fetch author profile
      const authorDoc = await getDoc(doc(db, 'users', authorId));
      if (authorDoc.exists()) {
        setViewingAuthor({ id: authorId, ...authorDoc.data() });
      } else {
        // Fallback if user profile doesn't exist in Firestore yet
        setViewingAuthor({ id: authorId, displayName: 'Ghibli Artist' });
      }

      // Fetch author posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
      );
      const postsSnap = await getDocs(postsQuery);
      const postsData = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuthorPosts(postsData);
    } catch (error) {
      console.error("Error fetching author profile:", error);
    } finally {
      setIsLoadingAuthorPosts(false);
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    try {
      // If it's a real post in Firestore
      if (typeof postId === 'string') {
        await deleteDoc(doc(db, 'posts', postId));
      }
      // Update local state
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. You might not have permission.");
    }
  };

  const fetchAllUsers = async () => {
    if (userProfile?.role !== 'admin') return;
    setIsLoadingUsers(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (profileTab === 'admin') {
      fetchAllUsers();
    }
  }, [profileTab]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Ghibli Fan',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: 'user',
            createdAt: serverTimestamp(),
            bio: ""
          });
        }
        
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserProfile(data);
            setBioInput(data.bio || "");
            setDisplayNameInput(data.displayName || currentUser.displayName || "Ghibli Fan");
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, userDocRef.path));

        setUser(currentUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setBioInput("");
        if (unsubscribeProfile) unsubscribeProfile();
        
        const hasVisited = localStorage.getItem('ghiblivibe-visited');
        if (!hasVisited) {
          setTimeout(() => setShowRecommend(true), 5000);
          localStorage.setItem('ghiblivibe-visited', 'true');
        }
      }
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    if (!selectedPost) {
      setPostComments([]);
      return;
    }

    const commentsRef = collection(db, 'posts', String(selectedPost.id), 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPostComments(commentsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, commentsRef.path));

    return () => unsubscribe();
  }, [selectedPost]);

  useEffect(() => {
    if (!selectedPost?.authorId) {
      setAuthorProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', selectedPost.authorId), (snapshot) => {
      if (snapshot.exists()) {
        setAuthorProfile(snapshot.data());
      } else {
        setAuthorProfile(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users/' + selectedPost.authorId));

    return () => unsubscribe();
  }, [selectedPost]);

  useEffect(() => {
    if (!user) {
      setFollowing(new Set());
      return;
    }

    const followingRef = collection(db, 'users', user.uid, 'following');
    const unsubscribe = onSnapshot(followingRef, (snapshot) => {
      const followingIds = new Set(snapshot.docs.map(doc => doc.id));
      setFollowing(followingIds);
    }, (error) => handleFirestoreError(error, OperationType.GET, followingRef.path));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedPost?.authorId) return;

    const followersRef = collection(db, 'users', selectedPost.authorId, 'followers');
    const unsubscribe = onSnapshot(followersRef, (snapshot) => {
      setFollowersCounts(prev => ({
        ...prev,
        [selectedPost.authorId]: snapshot.size
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, followersRef.path));

    return () => unsubscribe();
  }, [selectedPost]);

  const handleFollow = async (authorId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (authorId === user.uid) return;

    const isFollowing = following.has(authorId);
    
    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(doc(db, 'users', user.uid, 'following', authorId));
        await deleteDoc(doc(db, 'users', authorId, 'followers', user.uid));
      } else {
        // Follow
        const followData = {
          followerId: user.uid,
          followingId: authorId,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', user.uid, 'following', authorId), followData);
        await setDoc(doc(db, 'users', authorId, 'followers', user.uid), followData);

        // Create notification for the author
        await addDoc(collection(db, 'users', authorId, 'notifications'), {
          type: 'follow',
          fromId: user.uid,
          fromName: user.displayName || 'A Ghibli Fan',
          fromPhoto: user.photoURL,
          message: 'started following you',
          createdAt: serverTimestamp(),
          read: false
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handlePostComment = async () => {
    if (!user || !selectedPost || !commentText.trim()) return;

    try {
      const commentsRef = collection(db, 'posts', String(selectedPost.id), 'comments');
      await addDoc(commentsRef, {
        postId: String(selectedPost.id),
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });

      // Create notification for the author
      if (selectedPost.authorId !== user.uid) {
        await addDoc(collection(db, 'users', selectedPost.authorId, 'notifications'), {
          type: 'comment',
          fromId: user.uid,
          fromName: user.displayName || 'A Ghibli Fan',
          fromPhoto: user.photoURL,
          postId: selectedPost.id,
          postTitle: selectedPost.title,
          message: `commented on your post: "${commentText.substring(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) return;
    try {
      const recaptcha = new RecaptchaVerifier(auth, recaptchaRef.current!, {
        size: 'invisible'
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
      setConfirmResult(result);
    } catch (error) {
      console.error("Phone login failed:", error);
    }
  };

  const verifyCode = async () => {
    if (!confirmResult || !verificationCode) return;
    try {
      await confirmResult.confirm(verificationCode);
      setShowAuthModal(false);
      setConfirmResult(null);
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBgImage(reader.result as string);
        setShowColorPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInspirationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiInspirationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Firestore documents
        alert("Image size must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updates: any = {
        bio: bioInput,
        displayName: displayNameInput.trim() || user.displayName || 'Ghibli Fan',
      };
      if (profilePreview) {
        updates.photoURL = profilePreview;
      }

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), updates);
      
      // Update Auth Profile
      const authUpdates: any = {};
      if (profilePreview) authUpdates.photoURL = profilePreview;
      if (displayNameInput.trim()) authUpdates.displayName = displayNameInput.trim();

      if (Object.keys(authUpdates).length > 0) {
        await updateProfile(user, authUpdates);
        setUser({ ...user, ...authUpdates });
      }

      setShowProfileModal(false);
      setProfilePreview(null);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const BG_COLORS = [
    { name: 'Default', value: '#ffffff' },
    { name: 'Soft Pink', value: '#fff5f5' },
    { name: 'Sky Blue', value: '#f0f9ff' },
    { name: 'Matcha', value: '#f6fdf5' },
    { name: 'Cream', value: '#fffdf5' },
    { name: 'Dark', value: '#1a1a1a' },
  ];

  // Masonry effect moved to Home component for better ref handling
  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setPosts(prevPosts => {
        const newPosts = MOCK_POSTS.map(p => ({
          ...p,
          id: p.id + prevPosts.length,
          // Ensure new posts match current category if one is selected
          category: activeCategory === "All" ? p.category : activeCategory,
          authorId: p.authorId,
          authorName: p.authorName,
          image: `https://picsum.photos/seed/${p.id + prevPosts.length}/400/${400 + Math.floor(Math.random() * 400)}`
        }));
        return [...prevPosts, ...newPosts];
      });
      setLoading(false);
    }, 1000);
  }, [loading, activeCategory]);

  const filteredPosts = React.useMemo(() => {
    let basePosts = posts;
    if (activeView === 'Following') {
      basePosts = posts.filter(post => following.has(post.authorId));
    } else if (activeView === 'Gallery') {
      basePosts = posts.filter(post => post.category === "AI Generated");
    }

    return basePosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, activeCategory, activeView, following]);

  return (
    <div 
      className={`min-h-screen font-sans transition-colors duration-500 ${bgColor === '#1a1a1a' ? 'text-white' : 'text-gray-900'}`} 
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b border-gray-100 flex flex-col transition-colors duration-500 ${bgColor === '#1a1a1a' ? 'bg-[#1a1a1a]/90 border-gray-800' : 'bg-white/90 backdrop-blur-md'}`}>
        <div className="max-w-[1800px] mx-auto w-full px-4 py-3 pb-2">
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 sm:gap-4">
            <motion.div 
              className="text-2xl sm:text-3xl font-bold text-red-600 tracking-tighter shrink-0 cursor-pointer relative" 
              onClick={() => setActiveView('Home')}
            role="button"
            aria-label="Go to Ghiblivibe Home"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.span
              animate={{ 
                color: ['#dc2626', '#ef4444', '#dc2626'],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              𝓖𝓱𝓲𝓫𝓵𝓲𝓫𝓮
            </motion.span>
            
            <motion.div
              className="absolute inset-0 bg-red-400 rounded-lg blur-lg -z-10"
              initial={{ opacity: 0 }}
              whileHover={{ 
                opacity: 0.3,
                scale: 1.2
              }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.div>

          <div className="hidden lg:flex items-center gap-6 ml-4 mr-8" role="navigation" aria-label="Main Navigation">
            <button 
              onClick={() => setActiveView('Home')}
              className={`text-sm font-bold transition-all ${activeView === 'Home' ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
              aria-current={activeView === 'Home' ? 'page' : undefined}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveView('Following')}
              className={`text-sm font-bold transition-all ${activeView === 'Following' ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
              aria-current={activeView === 'Following' ? 'page' : undefined}
            >
              Following
            </button>
            <button 
              onClick={() => setActiveView('Gallery')}
              className={`text-sm font-bold transition-all ${activeView === 'Gallery' ? 'text-red-600' : 'text-gray-500 hover:text-gray-900'}`}
              aria-current={activeView === 'Gallery' ? 'page' : undefined}
            >
              AI Gallery
            </button>
          </div>
          
          <div className="w-full order-last mt-2 lg:mt-0 lg:w-auto lg:order-none lg:flex-1 max-w-2xl relative group" role="search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" size={18} aria-hidden="true" />
            <input 
              type="search"
              aria-label="Search content"
              placeholder="Search for aesthetics, characters, movies..."
              className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="relative">
              <button 
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2 rounded-full transition-colors ${showColorPicker ? 'bg-gray-100 text-red-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Change Background Color"
                aria-label="Change Background Color"
                aria-expanded={showColorPicker}
                aria-haspopup="true"
              >
                <Palette size={20} aria-hidden="true" />
              </button>
              
              <AnimatePresence>
                {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowColorPicker(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-64 z-50"
                    >
                      <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Background Color</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {BG_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setBgColor(color.value);
                              setBgImage(null);
                              setShowColorPicker(false);
                            }}
                            className={`w-full h-10 rounded-xl border-2 transition-all ${bgColor === color.value && !bgImage ? 'border-red-600 scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>

                      <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Background Image</p>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          className="w-full py-2 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
                        >
                          <Download size={16} className="rotate-180" />
                          Upload Image
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {bgImage && (
                          <button 
                            onClick={() => setBgImage(null)}
                            className="w-full py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors"
                          >
                            Clear Image
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-100 mr-1 sm:mr-2"
              aria-label="Create New Post"
            >
              <UserPlus size={18} aria-hidden="true" /> 
              <span className="hidden lg:inline">New Post</span>
            </button>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full text-sm font-bold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-100 mr-2"
              aria-label={"Open AI Generator"}
            >
              <Palette size={18} aria-hidden="true" /> 
              <span className="hidden sm:inline">AI Generator</span>
            </button>

            {user && (
              <div className="relative mr-2">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full transition-all relative ${showNotifications ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  aria-label={`Notifications ${notifications.filter(n => !n.read).length > 0 ? `(${notifications.filter(n => !n.read).length} unread)` : ''}`}
                  aria-expanded={showNotifications}
                  aria-haspopup="true"
                >
                  <Bell size={20} aria-hidden="true" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full" aria-hidden="true" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                    >
                      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">Notifications</h4>
                        <button 
                          onClick={async () => {
                            const unread = notifications.filter(n => !n.read);
                            for (const n of unread) {
                              await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
                            }
                          }}
                          className="text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-red-50/30' : ''}`}
                              onClick={async () => {
                                if (!notif.read) {
                                  await updateDoc(doc(db, 'users', user.uid, 'notifications', notif.id), { read: true });
                                }
                                if (notif.postId) {
                                  const post = posts.find(p => p.id === notif.postId);
                                  if (post) setSelectedPost(post);
                                }
                                setShowNotifications(false);
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 overflow-hidden">
                                <img src={notif.fromPhoto || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 leading-relaxed">
                                  <span className="font-bold">{notif.fromName}</span> {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                  {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                              <Bell size={20} />
                            </div>
                            <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`p-1.5 rounded-full transition-colors relative ${showUserDropdown || showProfileModal ? 'bg-gray-100 text-red-600' : 'text-gray-500 hover:bg-gray-100'}`}
                title={user ? "My Profile" : "Account actions"}
                aria-label={user ? "My Profile" : "Account actions"}
                aria-expanded={showUserDropdown}
              >
                {user ? (
                  <div className="relative">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} 
                      className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-red-600 transition-all cursor-pointer" 
                      alt="Me" 
                    />
                  </div>
                ) : (
                  <User size={20} />
                )}
              </button>

              <AnimatePresence>
                {showUserDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 flex flex-col p-2"
                    >
                      {user ? (
                        <>
                          <div className="px-3 py-2 border-b border-gray-50 mb-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{userProfile?.displayName || user.email}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{userProfile?.role || 'User'}</p>
                          </div>
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              setShowProfileModal(true);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors flex items-center gap-2"
                            aria-label="Open My Profile"
                          >
                            <User size={14} aria-hidden="true" /> My Profile
                          </button>
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              handleLogout();
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 mt-1"
                            aria-label="Log Out of Ghiblivibe"
                          >
                            <LogOut size={14} aria-hidden="true" /> Log Out
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              setAuthMode('login');
                              setShowAuthModal(true);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors flex items-center gap-2"
                            aria-label="Log In"
                          >
                            <LogIn size={14} aria-hidden="true" /> Log In
                          </button>
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              setAuthMode('signup');
                              setShowAuthModal(true);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors flex items-center gap-2"
                            aria-label="Sign Up"
                          >
                            <UserPlus size={14} aria-hidden="true" /> Sign Up
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </div>

        {/* Category Nav inside sticky header */}
        <nav aria-label="Category Navigation" className={`border-t transition-colors duration-500 ${bgColor === '#1a1a1a' ? 'border-gray-800' : 'border-gray-100/50'}`}>
          <div className="max-w-[1800px] mx-auto px-4 py-2 sm:py-3 flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                aria-controls="home-gallery-feed"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                  ? (bgColor === '#1a1a1a' ? 'bg-white text-black' : 'bg-gray-900 text-white')
                  : (bgColor === '#1a1a1a' ? 'bg-transparent text-gray-300 hover:bg-gray-800' : 'bg-transparent text-gray-700 hover:bg-gray-100')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="home-gallery-feed" className="max-w-[1800px] mx-auto px-2 sm:px-4 py-6 sm:py-8" role="tabpanel" aria-labelledby="category-selection-filter">
        <Home 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory}
          filteredPosts={filteredPosts}
          gridRef={gridRef}
          loadMore={loadMore}
          loading={loading}
          setSelectedPost={setSelectedPost}
          showReactions={showReactions}
          setShowReactions={setShowReactions}
          reactions={reactions}
          setReactions={setReactions}
          commentInputRef={commentInputRef}
          setShowShare={setShowShare}
          msnryRef={msnryRef}
          followersCounts={followersCounts}
          following={following}
          handleFollow={handleFollow}
          user={user}
          savedPosts={savedPosts}
          handleSavePost={handleSavePost}
          userProfile={userProfile}
          handleDeletePost={handleDeletePost}
          onViewProfile={handleViewAuthorProfile}
          onReport={handleOpenReport}
          onDelete={setShowDeleteConfirm}
        />
      </main>

      {/* Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-colors md:text-gray-400 md:hover:bg-gray-100 md:bg-white"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Side */}
              <div className="flex-[1.2] bg-gray-100 h-[40%] md:h-full relative">
                <img 
                  src={selectedPost.image} 
                  alt={selectedPost.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Details Side */}
              <div className="flex-1 p-6 sm:p-8 md:p-12 flex flex-col h-[60%] md:h-full overflow-y-auto custom-scrollbar">
                <div className="flex flex-col mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 relative group/author">
                      <div 
                        className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold overflow-hidden relative cursor-pointer"
                        onClick={() => handleViewAuthorProfile(selectedPost.authorId)}
                      >
                        <img src={authorProfile?.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} alt="Author" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 
                            className="font-bold text-gray-900 hover:underline cursor-pointer"
                            onClick={() => handleViewAuthorProfile(selectedPost.authorId)}
                          >
                            {authorProfile?.displayName || selectedPost.authorName || 'Ghibli Artist'}
                          </h4>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <span>{followersCounts[selectedPost.authorId] || 0} followers</span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-full left-0 hidden group-hover/author:block pt-4 z-[130]">
                        <UserPopover 
                          authorId={selectedPost.authorId}
                          authorName={authorProfile?.displayName || selectedPost.authorName}
                          authorPhoto={authorProfile?.photoURL}
                          followersCount={followersCounts[selectedPost.authorId]}
                          isFollowing={following.has(selectedPost.authorId)}
                          onFollow={handleFollow}
                          currentUser={user}
                          bio={authorProfile?.bio}
                          onViewProfile={handleViewAuthorProfile}
                        />
                      </div>
                    </div>
                    {user?.uid !== selectedPost.authorId && (
                      <button 
                        onClick={() => handleFollow(selectedPost.authorId)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                          following.has(selectedPost.authorId)
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                      >
                        {following.has(selectedPost.authorId) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                </div>

                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                >
                  {selectedPost.title}
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-600 mb-10 leading-relaxed space-y-4"
                >
                  <p>
                    Experience the magic of Studio Ghibli through this curated aesthetic. 
                    This piece captures the essence of {selectedPost.category}, bringing a touch of 
                    wonder and nostalgia to your digital space.
                  </p>
                  <p>
                    Perfect for wallpapers, inspiration boards, or simply admiring the 
                    breathtaking artistry that defines the Ghibli universe.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-6 mb-10 pb-6 border-b border-gray-100 relative"
                >
                  <div className="relative">
                    <button 
                      onClick={() => setShowReactions(showReactions === selectedPost.id ? null : selectedPost.id)}
                      className={`flex items-center gap-2 font-bold transition-colors ${reactions[selectedPost.id] ? 'text-red-600' : 'text-gray-900 hover:text-red-600'}`}
                    >
                      {reactions[selectedPost.id] ? (
                        <span className="text-2xl font-emoji px-1 flex items-center justify-center leading-normal mb-[2px]">{reactions[selectedPost.id]}</span>
                      ) : (
                        <Heart size={22} className={reactions[selectedPost.id] ? 'fill-current' : ''} />
                      )}
                      {reactions[selectedPost.id] ? 'Liked' : '1.2k'}
                    </button>

                    <AnimatePresence>
                      {showReactions === selectedPost.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.8 }}
                          className="absolute bottom-full left-0 mb-2 bg-white shadow-xl rounded-[2rem] px-4 py-2 flex flex-wrap max-w-[280px] sm:max-w-none items-center gap-2 sm:gap-3 border border-gray-100 z-[130]"
                        >
                          {['❤️', '😂', '😮', '😢', '😡', '🔥', '✨', '👏'].map((emoji) => (
                            <button 
                              key={emoji}
                              onClick={() => {
                                setReactions({ ...reactions, [selectedPost.id]: emoji });
                                setShowReactions(null);
                              }}
                              className="text-2xl hover:scale-125 transition-transform duration-200 font-emoji flex items-center justify-center leading-normal mb-[2px]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={() => commentInputRef.current?.focus()}
                    className="flex items-center gap-2 text-gray-900 font-bold hover:text-blue-600 transition-colors"
                  >
                    <MessageSquare size={22} /> 48
                  </button>

                  <button 
                    onClick={() => setShowShare(selectedPost)}
                    className="flex items-center gap-2 text-gray-900 font-bold hover:text-green-600 transition-colors relative"
                  >
                    <Share2 size={22} /> Share
                  </button>

                  <button 
                    onClick={() => handleOpenReport(selectedPost, 'post')}
                    className="flex items-center gap-2 text-gray-900 font-bold hover:text-red-600 transition-colors"
                  >
                    <Flag size={22} /> Report
                  </button>

                  {selectedPost.category === "AI Generated" && (
                    <button 
                      onClick={() => {
                        setAiPrompt(selectedPost.title);
                        setShowCreateModal(true);
                        setSelectedPost(null);
                      }}
                      className="flex items-center gap-2 text-gray-900 font-bold hover:text-purple-600 transition-colors"
                    >
                      <RefreshCw size={22} /> Re-generate
                    </button>
                  )}

                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch(selectedPost.image);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${selectedPost.title.replace(/\s+/g, '_').toLowerCase()}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Download failed:", error);
                        window.open(selectedPost.image, '_blank');
                      }
                    }}
                    className="flex items-center gap-2 text-gray-900 font-bold hover:text-red-600 transition-colors"
                  >
                    <Download size={22} /> Save
                  </button>
                </motion.div>

                <div className="flex-1">
                  <h5 className="font-bold mb-6 text-sm uppercase tracking-wider text-gray-400">Comments ({postComments.length})</h5>
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {postComments.length > 0 ? (
                      postComments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 overflow-hidden">
                            {comment.userPhoto ? (
                              <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                {comment.userName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none flex-1">
                            <p className="text-xs font-bold mb-1">{comment.userName}</p>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 italic text-sm">
                        No comments yet. Be the first to share your thoughts!
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0 overflow-hidden">
                      {user ? <img src={user.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} alt="Me" /> : 'G'}
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <textarea 
                        ref={commentInputRef}
                        placeholder={user ? "Add a comment..." : "Sign in to comment"}
                        disabled={!user}
                        className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all resize-none min-h-[100px] disabled:cursor-not-allowed"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end">
                        {user ? (
                          <button 
                            onClick={handlePostComment}
                            disabled={!commentText.trim()}
                            className="bg-red-600 text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Post Comment
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowAuthModal(true)}
                            className="bg-gray-900 text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-black transition-colors"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recommendation Toast */}
      <AnimatePresence>
        {showRecommend && !user && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 flex items-center gap-6 max-w-lg w-[90%]"
          >
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
              <Heart size={32} fill="currentColor" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg">Love these aesthetics?</h4>
              <p className="text-sm text-gray-600">Sign in to save your favorites and join the community!</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setShowRecommend(false); setShowAuthModal(true); }}
                className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => setShowRecommend(false)}
                className="text-gray-400 text-xs font-bold hover:text-gray-600"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Success Toast */}
      <AnimatePresence>
        {reportSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[320px]"
          >
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <Check size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Report Received</h4>
              <p className="text-[11px] text-gray-400">Thank you for helping keep Ghibli Vibe safe!</p>
            </div>
            <button onClick={() => setReportSuccess(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!showDeleteConfirm}
        title="Delete Post?"
        message="This action cannot be undone. Magic is permanent, but this post will be gone forever."
        onConfirm={() => {
          if (showDeleteConfirm) {
            handleDeletePost(showDeleteConfirm);
            setShowDeleteConfirm(null);
          }
        }}
        onCancel={() => setShowDeleteConfirm(null)}
        confirmText="Delete Forever"
        cancelText="Keep Magic"
      />
      <AnimatePresence>
        {showProfileModal && user && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSavingProfile) {
                  setShowProfileModal(false);
                  setProfilePreview(null);
                }
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 pb-0 shrink-0 text-center">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10" /> {/* Spacer */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
                    <p className="text-gray-500 text-sm">Manage your account and saved magic</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowProfileModal(false);
                      setProfilePreview(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex gap-8 border-b border-gray-100">
                  <button 
                    onClick={() => setProfileTab('settings')}
                    className={`pb-4 text-sm font-bold transition-all relative ${profileTab === 'settings' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Account Settings
                    {profileTab === 'settings' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
                  </button>
                  <button 
                    onClick={() => setProfileTab('saved')}
                    className={`pb-4 text-sm font-bold transition-all relative ${profileTab === 'saved' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Saved Posts ({savedPostsData.length})
                    {profileTab === 'saved' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
                  </button>
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => setProfileTab('admin')}
                      className={`pb-4 text-sm font-bold transition-all relative ${profileTab === 'admin' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Admin Dashboard
                      {profileTab === 'admin' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8 pt-6 overflow-y-auto flex-1 custom-scrollbar">
                {profileTab === 'settings' ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full border-4 border-gray-50 overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center relative">
                        {profilePreview || user.photoURL ? (
                          <img 
                            src={profilePreview || user.photoURL} 
                            alt="Profile Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={64} className="text-gray-300" />
                        )}
                      </div>
                      <button 
                        onClick={() => document.getElementById('profile-upload')?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full text-white text-xs font-bold"
                      >
                        Change Photo
                      </button>
                    </div>

                    <input 
                      type="file" 
                      id="profile-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleProfileFileChange}
                    />

                    <div className="w-full space-y-4">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Display Name</p>
                        <input 
                          type="text"
                          value={displayNameInput}
                          onChange={(e) => setDisplayNameInput(e.target.value)}
                          placeholder="Your Ghibli name..."
                          className="w-full bg-transparent font-bold text-gray-900 outline-none"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                        <p className="font-bold text-gray-400">{user.email || 'No email provided'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</p>
                        <div className="flex items-center gap-2">
                          {userProfile?.role === 'admin' ? (
                            <Shield size={14} className="text-red-600" />
                          ) : (
                            <User size={14} className="text-gray-400" />
                          )}
                          <p className="font-bold text-gray-900 capitalize">{userProfile?.role || 'user'}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Biography</p>
                        <textarea 
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          placeholder="Tell the world about your Ghibli journey..."
                          className="w-full bg-transparent font-medium text-gray-900 outline-none resize-none h-24 text-sm"
                          maxLength={500}
                        />
                        <div className="text-[10px] text-right text-gray-400 font-bold mt-1">
                          {bioInput.length}/500
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full sticky bottom-0 bg-white py-4 border-t border-gray-50 mt-4">
                      <button 
                        onClick={() => {
                          setShowProfileModal(false);
                          setProfilePreview(null);
                        }}
                        disabled={isSavingProfile}
                        className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={saveProfile}
                        disabled={isSavingProfile}
                        className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSavingProfile ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : null}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : profileTab === 'saved' ? (
                  <div className="w-full">
                    {savedPostsData.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {savedPostsData.map((post) => (
                        <motion.div 
                          key={post.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowProfileModal(false);
                          }}
                        >
                          <img 
                            src={post.image} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-[10px] font-bold truncate">{post.title}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSavePost(post);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-lg"
                          >
                            <Bookmark size={14} fill="currentColor" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Bookmark size={32} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">No saved magic yet</h4>
                      <p className="text-sm text-gray-500">Posts you save will appear here for quick access.</p>
                      <button 
                        onClick={() => setShowProfileModal(false)}
                        className="mt-6 text-red-600 font-bold text-sm hover:underline"
                      >
                        Explore Ghibli Vibes
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Shield size={18} className="text-red-600" />
                      Community Moderation
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAdminSubTab('users')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${adminSubTab === 'users' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        Users
                      </button>
                      <button 
                        onClick={() => setAdminSubTab('reports')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${adminSubTab === 'reports' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        Reports
                      </button>
                    </div>
                  </div>
                  
                  {adminSubTab === 'users' ? (
                    isLoadingUsers ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={fetchAllUsers}
                          className="w-full py-2 text-xs font-bold text-red-600 hover:underline mb-2"
                        >
                          Refresh User List
                        </button>
                        {allUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 overflow-hidden">
                                <img src={u.photoURL || `https://ui-avatars.com/api/?name=GV&background=dc2626&color=ffffff&bold=true`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                                <p className="text-[10px] text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                                {u.role || 'user'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    isLoadingReports ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={fetchReports}
                          className="w-full py-2 text-xs font-bold text-red-600 hover:underline mb-2"
                        >
                          Refresh Reports
                        </button>
                        {allReports.length > 0 ? (
                          allReports.map((report) => (
                            <div key={report.id} className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-transparent hover:border-red-100 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Flag size={14} className="text-red-600" />
                                  <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                    Reported {report.targetType}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${
                                  report.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                                  report.status === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {report.status}
                                </span>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reason</p>
                                  <p className="text-sm font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-100">{report.reason}</p>
                                </div>
                                
                                {report.details && (
                                  <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Additional Details</p>
                                    <p className="text-xs text-gray-600 bg-white/50 p-3 rounded-xl border border-gray-50 italic">"{report.details}"</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-end justify-between gap-4 pt-2 border-t border-gray-100/50">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-medium">Reporter: <span className="text-gray-600 font-bold">{report.reporterName}</span></p>
                                  <p className="text-[9px] text-gray-300 font-mono">{report.targetId}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    title="Mark as reviewed"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                    className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                                    title="Dismiss report"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 bg-gray-50 rounded-[2.5rem]">
                            <Flag size={48} className="text-gray-200 mx-auto mb-4" />
                            <h4 className="font-bold text-gray-900 mb-1">Clear Horizons</h4>
                            <p className="text-xs text-gray-500">No active reports to review right now.</p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="mt-auto px-8 pb-8 shrink-0">
                <button 
                  onClick={handleLogout}
                  className="text-sm font-bold text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2 w-full justify-center pt-6 border-t border-gray-50"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingAuthor && (
          <AuthorProfileModal 
            author={viewingAuthor}
            posts={authorPosts}
            isLoading={isLoadingAuthorPosts}
            onClose={() => setViewingAuthor(null)}
            onFollow={handleFollow}
            isFollowing={following.has(viewingAuthor.id)}
            followersCount={followersCounts[viewingAuthor.id]}
            currentUser={user}
            setSelectedPost={setSelectedPost}
            onReport={handleOpenReport}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {reportTarget && (
          <ReportModal
            target={reportTarget}
            targetType={reportTargetType}
            onClose={() => setReportTarget(null)}
            onReport={handleSubmitReport}
            isSubmitting={isSubmittingReport}
          />
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] md:rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Share magic</h3>
                <button 
                  onClick={() => setShowShare(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { 
                    name: 'WhatsApp', 
                    icon: 'https://cdn-icons-png.flaticon.com/512/733/733585.png', 
                    color: 'bg-[#25D366]', 
                    url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this Ghibli aesthetic! ${window.location.origin}/#post-${showShare.id}`)}` 
                  },
                  { 
                    name: 'Facebook', 
                    icon: 'https://cdn-icons-png.flaticon.com/512/733/733547.png', 
                    color: 'bg-[#1877F2]', 
                    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/#post-${showShare.id}`)}` 
                  },
                  { 
                    name: 'X', 
                    icon: 'https://cdn-icons-png.flaticon.com/512/5969/5969020.png', 
                    color: 'bg-[#000000]', 
                    url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${window.location.origin}/#post-${showShare.id}`)}&text=${encodeURIComponent('Check out this Ghibli aesthetic!')}` 
                  },
                  { 
                    name: 'Telegram', 
                    icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png', 
                    color: 'bg-[#0088cc]', 
                    url: `https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/#post-${showShare.id}`)}&text=${encodeURIComponent('Check out this Ghibli aesthetic!')}` 
                  },
                  { 
                    name: 'Gmail', 
                    icon: 'https://cdn-icons-png.flaticon.com/512/732/732200.png', 
                    color: 'bg-[#EA4335]', 
                    url: `mailto:?subject=${encodeURIComponent('Ghibli Aesthetic')}&body=${encodeURIComponent(`Check this out: ${window.location.origin}/#post-${showShare.id}`)}` 
                  },
                ].map((platform) => (
                  <a 
                    key={platform.name}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-14 h-14 ${platform.color} rounded-2xl flex items-center justify-center p-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <img src={platform.icon} alt={platform.name} className="w-full h-full object-contain brightness-0 invert" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{platform.name}</span>
                  </a>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3 border border-gray-100">
                <div className="flex-1 truncate text-xs text-gray-500 font-medium">
                  {window.location.origin}/#post-{showShare.id}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#post-${showShare.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUploadModal(false);
                setShowAIGenerator(false);
                setAiPrompt("");
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold">New Post</h3>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setShowAIGenerator(false);
                    setAiPrompt("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <div 
                    onClick={() => document.getElementById('post-image-upload')?.click()}
                    className="w-full aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 transition-all group overflow-hidden"
                    role="button"
                    tabIndex={0}
                    aria-label="Upload photo"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('post-image-upload')?.click();
                      }
                    }}
                  >
                    {!uploadImagePreview && (
                      <div id="upload-instructions" className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                          <Download size={24} className="rotate-180" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900">Click to upload photo</p>
                          <p className="text-xs text-gray-400 mt-1">High resolution Ghibli aesthetics preferred</p>
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      id="post-image-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setUploadImagePreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {uploadImagePreview && (
                      <div id="upload-placeholder" className="absolute inset-0 bg-white rounded-3xl overflow-hidden">
                        <img id="upload-preview" src={uploadImagePreview} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowAIGenerator(!showAIGenerator)}
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-white transition-all z-10"
                  >
                    <Palette size={14} />
                    {showAIGenerator ? 'Cancel AI' : 'Generate with AI'}
                  </button>
                </div>

                {showAIGenerator && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4"
                  >
                    {isGeneratingAI ? (
                      <div className="py-8 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-3" />
                        <p className="text-red-600 font-bold animate-pulse text-sm">Generating AI image...</p>
                        <div className="w-32 h-1 bg-red-200 rounded-full mt-4 overflow-hidden relative">
                          <motion.div 
                            className="absolute top-0 left-0 h-full bg-red-600 rounded-full w-1/2"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <Palette size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">AI Ghibli Generator</span>
                        </div>
                    <textarea 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe your Ghibli dream... (e.g., 'A floating garden with a small cottage and a cat')"
                      className="w-full bg-white border border-red-100 rounded-2xl p-4 text-sm outline-none focus:border-red-600 transition-all resize-none h-20"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="ai-style-select" className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">Style</label>
                        <select 
                          id="ai-style-select"
                          value={aiStyle}
                          onChange={(e) => setAiStyle(e.target.value)}
                          className="w-full bg-white border border-red-100 focus:border-red-600 rounded-xl p-2.5 text-[10px] font-bold outline-none transition-all appearance-none"
                          aria-label="Select AI Generation Style"
                        >
                          {["Ghibli", "Watercolor", "Oil Painting", "Sketch", "Cyberpunk", "Anime", "Impressionism", "Abstract", "Fantasy", "Sci-Fi", "Minimalist"].map(style => (
                            <option key={style} value={style}>{style}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">Aspect Ratio</label>
                        <div className="flex gap-1.5" role="group" aria-label="Aspect Ratio Selection">
                          {(["1:1", "16:9", "9:16"] as const).map(ratio => (
                            <button
                              key={ratio}
                              onClick={() => setAiAspectRatio(ratio)}
                              className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all border ${
                                aiAspectRatio === ratio 
                                  ? "bg-red-600 text-white border-red-600" 
                                  : "bg-white text-red-400 border-red-100 hover:bg-red-50"
                              }`}
                              aria-pressed={aiAspectRatio === ratio}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">Resolution</label>
                      <div className="flex gap-1.5">
                        {(["Standard", "High", "4K", "8K"] as const).map(res => (
                          <button
                            key={res}
                            onClick={() => setAiResolution(res)}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all border ${
                              aiResolution === res 
                                ? "bg-red-600 text-white border-red-600" 
                                : "bg-white text-red-400 border-red-100 hover:bg-red-50"
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleGenerateAIImage('upload')}
                      disabled={!aiPrompt.trim()}
                      className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                      <Palette size={18} />
                      Generate Magic
                    </button>
                    <p className="text-[10px] text-red-400 text-center font-medium">
                      Powered by Gemini AI • Ghibli-style enhancement applied automatically
                    </p>
                      </>
                    )}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                    <input 
                      id="post-title"
                      type="text"
                      placeholder="Give your post a title..."
                      className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                    <select 
                      id="post-category"
                      className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all appearance-none"
                    >
                      {CATEGORIES.filter(c => c !== "All").map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const title = (document.getElementById('post-title') as HTMLInputElement)?.value;
                    const category = (document.getElementById('post-category') as HTMLSelectElement)?.value;
                    const preview = uploadImagePreview;
                    
                    if (!title || !preview) {
                      alert("Please add a title and photo!");
                      return;
                    }

                    const newPost = {
                      id: Date.now(),
                      title,
                      image: preview,
                      category,
                      authorId: user?.uid || "me",
                      authorName: user?.displayName || "Me"
                    };
                    
                    setPosts([newPost, ...posts]);

                    // Notify followers (Infrastructure)
                    if (user) {
                      const followersRef = collection(db, 'users', user.uid, 'followers');
                      getDocs(followersRef).then(snapshot => {
                        snapshot.docs.forEach(followerDoc => {
                          const followerId = followerDoc.id;
                          addDoc(collection(db, 'users', followerId, 'notifications'), {
                            type: 'new_post',
                            fromId: user.uid,
                            fromName: user.displayName || 'A Ghibli Fan',
                            fromPhoto: user.photoURL,
                            postId: newPost.id,
                            postTitle: newPost.title,
                            message: `published a new post: ${newPost.title}`,
                            createdAt: serverTimestamp(),
                            read: false
                          });
                        });
                      });
                    }

                    setShowUploadModal(false);
                    setUploadImagePreview(null);
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-100 flex items-center justify-center gap-2"
                >
                  Publish Post
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateModal(false);
                setIsGeneratingAI(false);
                setAiGeneratedImage(null);
                setAiInspirationImage(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold">Create Magic</h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setIsGeneratingAI(false);
                    setAiGeneratedImage(null);
                    setAiInspirationImage(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {isGeneratingAI ? (
                  <div className="space-y-6">
                    <div className={`w-full rounded-3xl overflow-hidden shadow-inner flex flex-col items-center justify-center bg-gray-50 border border-gray-100 ${
                      aiAspectRatio === "1:1" ? "aspect-square" : 
                      aiAspectRatio === "16:9" ? "aspect-video" : 
                      "aspect-[9/16]"
                    }`}>
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-4" />
                      <p className="text-gray-900 font-bold animate-pulse text-lg">Creating your masterpiece...</p>
                      <p className="text-xs text-gray-500 mt-2 text-center max-w-[80%] px-4">Depending on the resolution and complexity, this may take 10-20 seconds.</p>
                      <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden relative">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-red-600 rounded-full w-1/2"
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : aiGeneratedImage ? (
                  <div className="space-y-6">
                    <div className={`w-full rounded-3xl overflow-hidden shadow-inner bg-gray-50 ${
                      aiAspectRatio === "1:1" ? "aspect-square" : 
                      aiAspectRatio === "16:9" ? "aspect-video" : 
                      "aspect-[9/16]"
                    }`}>
                      <img src={aiGeneratedImage} className="w-full h-full object-cover" alt="AI Generated" />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setAiGeneratedImage(null)}
                        className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={() => {
                          setUploadImagePreview(aiGeneratedImage);
                          setShowCreateModal(false);
                          setShowUploadModal(true);
                          setAiGeneratedImage(null);
                        }}
                        className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={20} /> Use for Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex border-b border-gray-100 mb-6">
                      <button 
                        onClick={() => setAiModalTab('prompt')}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${aiModalTab === 'prompt' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Prompt
                      </button>
                      <button 
                        onClick={() => setAiModalTab('settings')}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${aiModalTab === 'settings' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Settings
                      </button>
                      <button 
                        onClick={() => setAiModalTab('inspiration')}
                        className={`flex-1 py-3 text-sm font-bold transition-all ${aiModalTab === 'inspiration' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        Inspiration
                      </button>
                    </div>

                    {aiModalTab === 'prompt' ? (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Describe your vision</label>
                          <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g., 'A floating garden in the style of Laputa'"
                            className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white rounded-2xl p-4 text-sm outline-none transition-all resize-none h-32 shadow-inner"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Try a template</label>
                          <div className="flex flex-wrap gap-2">
                            {PROMPT_TEMPLATES.map(template => (
                              <button
                                key={template.name}
                                onClick={() => setAiPrompt(template.prompt)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-full text-[10px] font-bold text-gray-500 transition-all border border-transparent hover:border-red-100"
                              >
                                {template.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : aiModalTab === 'settings' ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Artistic Style</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Ghibli", "Watercolor", "Oil Painting", "Sketch", "Cyberpunk", "Anime", "Impressionism", "Abstract", "Fantasy", "Sci-Fi", "Minimalist"].map(style => (
                              <button
                                key={style}
                                onClick={() => setAiStyle(style)}
                                className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                                  aiStyle === style 
                                    ? "bg-red-600 text-white border-red-600 shadow-md" 
                                    : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Aspect Ratio</label>
                            <div className="flex gap-2">
                              {(["1:1", "16:9", "9:16"] as const).map(ratio => (
                                <button
                                  key={ratio}
                                  onClick={() => setAiAspectRatio(ratio)}
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                                    aiAspectRatio === ratio 
                                      ? "bg-red-600 text-white border-red-600 shadow-md" 
                                      : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                                  }`}
                                >
                                  {ratio}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Resolution</label>
                            <div className="flex flex-wrap gap-2">
                              {(["Standard", "High", "4K", "8K"] as const).map(res => (
                                <button
                                  key={res}
                                  onClick={() => setAiResolution(res)}
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                                    aiResolution === res 
                                      ? "bg-red-600 text-white border-red-600 shadow-md" 
                                      : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
                                  }`}
                                >
                                  {res}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Inspiration Image</label>
                          <div 
                            onClick={() => document.getElementById('ai-inspiration-upload')?.click()}
                            className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 transition-all group overflow-hidden relative"
                          >
                            {aiInspirationImage ? (
                              <>
                                <img src={aiInspirationImage} className="w-full h-full object-cover" alt="Inspiration" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <p className="text-white text-xs font-bold">Change Image</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                  <Download size={24} className="rotate-180" />
                                </div>
                                <p className="text-xs font-bold text-gray-400">Upload inspiration image</p>
                              </>
                            )}
                          </div>
                          <input 
                            id="ai-inspiration-upload"
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleInspirationUpload}
                          />
                          {aiInspirationImage && (
                            <button 
                              onClick={() => setAiInspirationImage(null)}
                              className="text-xs font-bold text-red-600 hover:underline"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Image Influence</label>
                            <span className="text-xs font-bold text-red-600">{Math.round(aiImageInfluence * 100)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={aiImageInfluence}
                            onChange={(e) => setAiImageInfluence(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>More Prompt</span>
                            <span>More Image</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => handleGenerateAIImage('create')}
                      disabled={!aiPrompt.trim()}
                      id="generate-btn"
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                    >
                      <Palette size={20} />
                      Generate Image
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8"
            >
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-3xl font-bold tracking-tighter text-red-600 mb-2">𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮</h2>
                <p className="text-gray-500 font-medium">
                  {authMode === 'login' ? 'Welcome back to the magic.' : 'Join the Ghibli community.'}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Or use phone</span></div>
                </div>

                {!confirmResult ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="tel" 
                        placeholder="+1 234 567 890"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <div ref={recaptchaRef}></div>
                    <button 
                      onClick={handlePhoneLogin}
                      className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                    >
                      Send Code
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit code"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl py-3 px-4 outline-none transition-all font-medium text-center tracking-[0.5em]"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button 
                      onClick={verifyCode}
                      className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
                    >
                      Verify & Sign In
                    </button>
                    <button 
                      onClick={() => setConfirmResult(null)}
                      className="text-sm text-gray-500 font-bold hover:text-gray-700"
                    >
                      Change phone number
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-bold text-gray-500 hover:text-red-600 transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyPolicy && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyPolicy(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Privacy Policy</h2>
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1">Ghiblivibe Legal</p>
                </div>
                <button 
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-600 space-y-6">
                <p>
                  At Ghiblivibe, accessible from <a href="https://www.profitablecpmratenetwork.com/uxcg38rej?key=5b7e6be4d8bd9339d798cf7d7d66ed27" className="text-red-600 hover:underline break-all" target="_blank" rel="noreferrer">https://www.profitablecpmratenetwork.com/uxcg38rej?key=5b7e6be4d8bd9339d798cf7d7d66ed27</a>, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Ghiblivibe and how we use it.
                </p>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">1. Log Files</h3>
                  <p className="mb-2">Ghiblivibe follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-2 text-gray-500">
                    <li>Internet Protocol (IP) addresses.</li>
                    <li>Browser type and Internet Service Provider (ISP).</li>
                    <li>Date and time stamp.</li>
                    <li>Referring/exit pages and possibly the number of clicks.</li>
                  </ul>
                  <p>These are not linked to any information that is personally identifiable.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">2. Cookies and Web Beacons</h3>
                  <p>Like any other website, Ghiblivibe uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">3. Google DoubleClick DART Cookie</h3>
                  <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">4. Our Advertising Partners</h3>
                  <p className="mb-2">Some of advertisers on our site may use cookies and web beacons. Our advertising partners include:</p>
                  <ul className="list-disc pl-5">
                    <li>Google AdSense</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">5. Third Party Privacy Policies</h3>
                  <p>Ghiblivibe's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">6. Children's Information</h3>
                  <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.</p>
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">7. Consent</h3>
                  <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h1 className="text-xl font-bold text-red-600 mb-2">𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮</h1>
            <p className="text-gray-500 text-sm">© 2026 𝓖𝓱𝓲𝓫𝓵𝓲𝓿𝓲𝓫𝓮. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-red-600 transition-colors">Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyPolicy(true); }} className="hover:text-red-600 transition-colors cursor-pointer">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
