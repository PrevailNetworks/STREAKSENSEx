
// src/services/userService.ts
import { db } from '@/firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, Timestamp, serverTimestamp, query, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { PlayerData, PlayerPickInfo, UserDailyPicksDocument, FavoritePlayer } from '@/types';

const DAILY_PICKS_SUBCOLLECTION = 'dailyPicks';

export const addUserDailyPick = async (userId: string, dateKey: string, newPickData: Omit<PlayerPickInfo, 'pickedAt' | 'pickDate'>): Promise<{success: boolean, message: string, picks?: PlayerPickInfo[]}> => {
  if (!userId || !dateKey || !newPickData.playerId) {
    return { success: false, message: "Missing required information to save pick." };
  }
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    const docSnap = await getDoc(pickDocRef);

    const pickToAdd: PlayerPickInfo = {
      ...newPickData,
      pickDate: dateKey,
      pickedAt: new Date(), // Client-side timestamp for immediate use, server will set its own
    };

    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserDailyPicksDocument;
      const existingPicks = existingData.picks || [];

      if (existingPicks.length >= 2) {
        return { success: false, message: "You already have two picks for this date. Remove one first.", picks: existingPicks };
      }
      if (existingPicks.some(p => p.playerId === pickToAdd.playerId)) {
        return { success: false, message: `${pickToAdd.playerName} is already one of your picks.`, picks: existingPicks };
      }
      
      const updatedPicks = [...existingPicks, pickToAdd];
      await updateDoc(pickDocRef, {
        picks: updatedPicks,
        lastUpdatedAt: serverTimestamp(),
      });
      console.log(`User ${userId}'s pick for ${dateKey} (${newPickData.playerName}) added. Total picks: ${updatedPicks.length}`);
      return { success: true, message: `${newPickData.playerName} added as pick ${updatedPicks.length}.`, picks: updatedPicks };
    } else {
      // No existing document, create it with the first pick
      const newDocument: UserDailyPicksDocument = {
        picks: [pickToAdd],
        lastUpdatedAt: new Date(), // serverTimestamp() will apply on write
      };
      await setDoc(pickDocRef, {
        ...newDocument,
        lastUpdatedAt: serverTimestamp(),
      });
      console.log(`User ${userId}'s first pick for ${dateKey} (${newPickData.playerName}) saved.`);
      return { success: true, message: `${newPickData.playerName} added as pick 1.`, picks: [pickToAdd]};
    }
  } catch (error) {
    console.error(`Error adding daily pick for user ${userId} on ${dateKey}:`, error);
    return { success: false, message: `Error adding pick: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
};

export const getUserDailyPicks = async (userId: string, dateKey: string): Promise<UserDailyPicksDocument | null> => {
  if (!userId || !dateKey) return null;
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    const docSnap = await getDoc(pickDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserDailyPicksDocument;
      // Convert Firestore Timestamps to JS Dates
      if (data.lastUpdatedAt instanceof Timestamp) {
        data.lastUpdatedAt = data.lastUpdatedAt.toDate();
      }
      data.picks.forEach(pick => {
        if (pick.pickedAt instanceof Timestamp) {
          pick.pickedAt = pick.pickedAt.toDate();
        }
      });
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching daily picks for user ${userId} on ${dateKey}:`, error);
    return null;
  }
};

export const removeUserDailyPick = async (userId: string, dateKey: string, playerIdToRemove: string): Promise<{success: boolean, message: string, picks?: PlayerPickInfo[]}> => {
  if (!userId || !dateKey || !playerIdToRemove) {
    return { success: false, message: "Missing required information to remove pick." };
  }
  try {
    const pickDocRef = doc(db, 'users', userId, DAILY_PICKS_SUBCOLLECTION, dateKey);
    const docSnap = await getDoc(pickDocRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data() as UserDailyPicksDocument;
      const updatedPicks = existingData.picks.filter(p => p.playerId !== playerIdToRemove);

      if (updatedPicks.length === existingData.picks.length) {
         return { success: false, message: "Pick not found.", picks: existingData.picks };
      }

      if (updatedPicks.length === 0) {
        // If all picks are removed, delete the document for that date
        await deleteDoc(pickDocRef);
        console.log(`User ${userId}'s pick document for ${dateKey} removed as all picks deleted.`);
        return { success: true, message: "Pick removed. No picks remaining for this date.", picks: [] };
      } else {
        await updateDoc(pickDocRef, {
          picks: updatedPicks,
          lastUpdatedAt: serverTimestamp(),
        });
        console.log(`User ${userId}'s pick (${playerIdToRemove}) for ${dateKey} removed.`);
        return { success: true, message: "Pick removed.", picks: updatedPicks };
      }
    } else {
      return { success: false, message: "No picks found for this date to remove." };
    }
  } catch (error) {
    console.error(`Error removing daily pick for user ${userId} on ${dateKey}:`, error);
    return { success: false, message: `Error removing pick: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
};


// --- User Favorite Players ---
const FAVORITE_PLAYERS_SUBCOLLECTION = 'favoritePlayers';

// Note: The FavoritePlayer interface is now solely imported from '@/types'.
// The local definition has been removed.

export const addPlayerToFavorites = async (userId: string, playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>): Promise<void> => {
  const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
  if (!userId || !playerId) {
    console.error("Missing userId or playerId for adding to favorites.");
    throw new Error("Missing required information to add favorite.");
  }
  try {
    const favoriteDocRef = doc(db, 'users', userId, FAVORITE_PLAYERS_SUBCOLLECTION, playerId);
    // Ensure data confirms to FavoritePlayer from types.ts, adapting for Firestore Timestamps
    const dataToSave: Omit<FavoritePlayer, 'addedAt'> & { addedAt: Timestamp } = {
      playerId: playerId,
      playerName: playerData.player,
      team: playerData.team,
      mlbId: playerData.mlbId,
      addedAt: serverTimestamp() as Timestamp, // Firestore expects Timestamp
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
  } catch (error) {
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
    querySnapshot.forEach((docSnap) => { 
      const data = docSnap.data();
      let addedAtDate: Date;
      if (data.addedAt instanceof Timestamp) {
        addedAtDate = data.addedAt.toDate();
      } else if (data.addedAt instanceof Date) { // Should ideally always be Timestamp from server
        addedAtDate = data.addedAt;
      } else {
        addedAtDate = new Date(); // Fallback, though ideally this case shouldn't happen
        console.warn(`Favorite player ${docSnap.id} for user ${userId} has an unexpected addedAt type. Using current date as fallback.`);
      }
      favorites.push({ 
        playerId: docSnap.id,
        playerName: data.playerName,
        team: data.team,
        mlbId: data.mlbId,
        addedAt: addedAtDate 
      } as FavoritePlayer);
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
