
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
  source: 'recommendation' | 'researched' | 'favorite' | 'direct_input'; // Where the pick came from
  pickedAt: Timestamp | Date; // Allow Date for optimistic updates, server will convert
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
    const dataToSave: Omit<UserDailyPick, 'pickedAt'> & { pickedAt: Timestamp } = {
      ...pickData,
      pickDate: dateKey,
      pickedAt: serverTimestamp() as Timestamp, // Firestore will set this
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
      // Convert Firestore Timestamp to JS Date if needed for client-side use
      const data = docSnap.data() as UserDailyPick;
      if (data.pickedAt instanceof Timestamp) {
        data.pickedAt = data.pickedAt.toDate();
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching daily pick for user ${userId} on ${dateKey}:`, error);
    return null;
  }
};

export const removeUserDailyPick = async (userId: string, dateKey: string): Promise<void> => {
  if (!userId || !dateKey) {
    console.error("Missing userId or dateKey for removing daily pick.");
    throw new Error("Missing required information to remove pick.");
  }
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    await deleteDoc(pickDocRef);
    console.log(`User ${userId}'s pick for ${dateKey} removed.`);
  } catch (error) {
    console.error(`Error removing daily pick for user ${userId} on ${dateKey}:`, error);
    throw error;
  }
};


// --- User Favorite Players ---
const FAVORITE_PLAYERS_SUBCOLLECTION = 'favoritePlayers';

export interface FavoritePlayer {
  playerId: string; // mlbId or unique name, used as document ID
  playerName: string;
  team: string;
  mlbId?: string;
  addedAt: Timestamp | Date; // Allow Date for optimistic updates
}

export const addPlayerToFavorites = async (userId: string, playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>): Promise<void> => {
  const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
  if (!userId || !playerId) {
    console.error("Missing userId or playerId for adding to favorites.");
    throw new Error("Missing required information to add favorite.");
  }
  try {
    const favoriteDocRef = doc(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION, playerId);
    const dataToSave: Omit<FavoritePlayer, 'addedAt'> & { addedAt: Timestamp } = {
      playerId: playerId,
      playerName: playerData.player,
      team: playerData.team,
      mlbId: playerData.mlbId,
      addedAt: serverTimestamp() as Timestamp,
    };
    await setDoc(favoriteDocRef, dataToSave, { merge: true }); 
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
  } catch (error) { // Corrected: removed trailing underscore
    console.error(`Error removing player ${playerId} from favorites for user ${userId}:`, error);
    throw error;
  }
};

export const getUserFavoritePlayers = async (userId: string): Promise<FavoritePlayer[]> => {
  if (!userId) return [];
  try {
    const favoritesColRef = collection(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION);
    const q = query(favoritesColRef, orderBy('addedAt', 'desc')); 
    const querySnapshot = await getDocs(q);
    const favorites: FavoritePlayer[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FavoritePlayer;
      if (data.addedAt instanceof Timestamp) {
        data.addedAt = data.addedAt.toDate();
      }
      favorites.push({ ...data, playerId: doc.id });
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
    return false; 
  }
};