
// src/services/userService.ts
import { db } from '@/firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, Timestamp, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { PlayerData } from '@/types'; // Assuming PlayerData might be stored or referenced

// --- User Daily Picks ---
const DAILY_PICKS_SUBCOLLECTION = 'dailyPicks';

export interface UserDailyPick {
  playerId: string; // mlbId or unique player name
  playerName: string;
  team: string;
  pickDate: string; // YYYY-MM-DD format
  source: 'recommendation' | 'researched' | 'favorite'; // Where the pick came from
  pickedAt: Timestamp;
  // Optional: store full PlayerData if needed, or just key info
  // playerData?: PlayerData; 
}

export const saveUserDailyPick = async (userId: string, dateKey: string, pickData: Omit<UserDailyPick, 'pickedAt' | 'pickDate'>): Promise<void> => {
  if (!userId || !dateKey || !pickData.playerId) {
    console.error("Missing userId, dateKey, or playerId for saving daily pick.");
    throw new Error("Missing required information to save pick.");
  }
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    const dataToSave: UserDailyPick = {
      ...pickData,
      pickDate: dateKey,
      pickedAt: serverTimestamp() as Timestamp,
    };
    // For "Beat the Streak", usually one pick. setDoc will overwrite if document for dateKey exists.
    await setDoc(pickDocRef, dataToSave); 
    console.log(`User ${userId}'s pick for ${dateKey} (${pickData.playerName}) saved.`);
  } catch (error) {
    console.error(`Error saving daily pick for user ${userId} on ${dateKey}:`, error);
    throw error;
  }
};

export const getUserDailyPick = async (userId: string, dateKey: string): Promise<UserDailyPick | null> => {
  if (!userId || !dateKey) return null;
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    const docSnap = await getDoc(pickDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDailyPick;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching daily pick for user ${userId} on ${dateKey}:`, error);
    return null;
  }
};


// --- User Favorite Players ---
const FAVORITE_PLAYERS_SUBCOLLECTION = 'favoritePlayers';

export interface FavoritePlayer {
  playerId: string; // mlbId or unique name, used as document ID
  playerName: string;
  team: string;
  mlbId?: string;
  addedAt: Timestamp;
}

export const addPlayerToFavorites = async (userId: string, playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>): Promise<void> => {
  const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
  if (!userId || !playerId) {
    console.error("Missing userId or playerId for adding to favorites.");
    throw new Error("Missing required information to add favorite.");
  }
  try {
    const favoriteDocRef = doc(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION, playerId);
    const dataToSave: FavoritePlayer = {
      playerId: playerId,
      playerName: playerData.player,
      team: playerData.team,
      mlbId: playerData.mlbId,
      addedAt: serverTimestamp() as Timestamp,
    };
    await setDoc(favoriteDocRef, dataToSave, { merge: true }); // Merge in case it was re-added
    console.log(`Player ${playerData.player} added to user ${userId}'s favorites.`);
  } catch (error) {
    console.error(`Error adding player ${playerData.player} to favorites for user ${userId}:`, error);
    throw error;
  }
};

export const removePlayerFromFavorites = async (userId: string, playerId: string): Promise<void> => {
  if (!userId || !playerId) {
    console.error("Missing userId or playerId for removing from favorites.");
    throw new Error("Missing required information to remove favorite.");
  }
  try {
    const favoriteDocRef = doc(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION, playerId);
    await deleteDoc(favoriteDocRef);
    console.log(`Player ${playerId} removed from user ${userId}'s favorites.`);
  } catch (error) {
    console.error(`Error removing player ${playerId} from favorites for user ${userId}:`, error);
    throw error;
  }
};

export const getUserFavoritePlayers = async (userId: string): Promise<FavoritePlayer[]> => {
  if (!userId) return [];
  try {
    const favoritesColRef = collection(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION);
    const q = query(favoritesColRef, orderBy('addedAt', 'desc')); // Order by when they were added
    const querySnapshot = await getDocs(q);
    const favorites: FavoritePlayer[] = [];
    querySnapshot.forEach((doc) => {
      favorites.push({ ...(doc.data() as FavoritePlayer), playerId: doc.id });
    });
    return favorites;
  } catch (error) {
    console.error(`Error fetching favorite players for user ${userId}:`, error);
    return [];
  }
};

export const isPlayerFavorite = async (userId: string, playerId: string): Promise<boolean> => {
  if (!userId || !playerId) return false;
  try {
    const favoriteDocRef = doc(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION, playerId);
    const docSnap = await getDoc(favoriteDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking if player ${playerId} is favorite for user ${userId}:`, error);
    return false; // Default to false on error
  }
};
