
// src/services/firestoreService.ts
import { db } from '@/firebase'; 
import { doc, getDoc, setDoc, Timestamp, collection, serverTimestamp } from 'firebase/firestore';
import type { AnalysisReport, PlayerData } from '@/types';

const REPORTS_COLLECTION = 'analysisReports';
const ADDITIONAL_PLAYERS_SUBCOLLECTION = 'additionalPlayers';


interface StoredAnalysisReport extends Omit<AnalysisReport, 'recommendations'> {
  recommendations: StoredPlayerData[]; // Assuming recommendations also store fetchedAt individually if needed
  fetchedAt: Timestamp;
}

export interface FirestoreReportWithTimestamp {
  report: AnalysisReport;
  fetchedAt: Date;
}

// Main daily analysis report (top 5)
export const getAnalysisReportFromFirestore = async (dateString: string): Promise<FirestoreReportWithTimestamp | null> => {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, dateString);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as StoredAnalysisReport; 
      console.log(`Report for ${dateString} successfully retrieved from Firestore. Fetched at: ${data.fetchedAt.toDate().toISOString()}`);
      
      if (!data.recommendations) {
          console.warn(`Firestore data for ${dateString} is missing 'recommendations'. Returning null.`);
          return null;
      }
      const fetchedAtJSDate = data.fetchedAt.toDate();
      
      // Ensure PlayerData within recommendations also get the fetchedAt property if not already set
      // (though App.tsx is now the primary place for this for main reports)
      const processedRecommendations = (data.recommendations as any[]).map(rec => ({
          ...rec,
          fetchedAt: rec.fetchedAt instanceof Timestamp ? rec.fetchedAt.toDate() : (rec.fetchedAt || fetchedAtJSDate)
      }));

      return { 
        report: { ...data, recommendations: processedRecommendations } as AnalysisReport, 
        fetchedAt: fetchedAtJSDate 
      };
    } else {
      console.log(`No report found in Firestore for date: ${dateString}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching report for ${dateString} from Firestore:`, error);
    return null; 
  }
};

export const saveAnalysisReportToFirestore = async (dateString: string, report: AnalysisReport): Promise<void> => {
  if (!report || !report.recommendations || report.recommendations.length === 0) {
    console.warn(`Attempted to save an empty or incomplete main report for ${dateString} to Firestore. Skipping save.`);
    return;
  }
  try {
    // fetchedAt for individual recommendations should ideally be set before calling this,
    // or be the same as the main report's fetchedAt.
    const reportWithTimestamp = {
      ...report,
      fetchedAt: serverTimestamp(), // Use server timestamp for the main report document
    };
    const docRef = doc(db, REPORTS_COLLECTION, dateString);
    await setDoc(docRef, reportWithTimestamp);
    console.log(`Main report for ${dateString} successfully saved to Firestore.`);
  } catch (error) {
    console.error(`Error saving main report for ${dateString} to Firestore:`, error);
  }
};


// --- Functions for "additional" user-requested player reports ---

interface StoredPlayerData extends Omit<PlayerData, 'fetchedAt'> {
  fetchedAt: Timestamp; 
}

export const getAdditionalPlayerReport = async (dateKey: string, playerId: string): Promise<PlayerData | null> => {
  try {
    const playerDocRef = doc(db, REPORTS_COLLECTION, dateKey, ADDITIONAL_PLAYERS_SUBCOLLECTION, playerId);
    const docSnap = await getDoc(playerDocRef);
    if (docSnap.exists()) {
      const firestoreData = docSnap.data() as StoredPlayerData;
      console.log(`Additional player report for ${playerId} on ${dateKey} found in Firestore.`);
      
      // Convert Firestore Timestamp to JS Date for the fetchedAt field
      const fetchedAtJSDate = firestoreData.fetchedAt.toDate();
      
      return { 
        ...firestoreData, 
        fetchedAt: fetchedAtJSDate 
      } as PlayerData; 
    }
    console.log(`No additional player report found for ${playerId} on ${dateKey} in Firestore.`);
    return null;
  } catch (error) {
    console.error(`Error fetching additional player report for ${playerId} on ${dateKey}:`, error);
    return null;
  }
};

export const saveAdditionalPlayerReport = async (dateKey: string, playerId: string, reportData: PlayerData): Promise<void> => {
  if (!reportData || !reportData.player) {
    console.warn(`Attempted to save an empty or incomplete additional player report for ${playerId} on ${dateKey}. Skipping.`);
    return;
  }
  try {
    const playerDocRef = doc(db, REPORTS_COLLECTION, dateKey, ADDITIONAL_PLAYERS_SUBCOLLECTION, playerId);
    const { fetchedAt, ...restOfReportData } = reportData; // Separate fetchedAt if it's already a JS Date
    
    const dataToSave = {
      ...restOfReportData,
      // Always use serverTimestamp when saving/updating to Firestore for consistency
      // The fetchedAt on reportData (JS Date) is for client display, not for resaving.
      fetchedAt: serverTimestamp(), 
    };
    await setDoc(playerDocRef, dataToSave, { merge: true }); 
    console.log(`Additional player report for ${playerId} on ${dateKey} saved successfully.`);
  } catch (error) {
    console.error(`Error saving additional player report for ${playerId} on ${dateKey}:`, error);
    throw error; 
  }
};
