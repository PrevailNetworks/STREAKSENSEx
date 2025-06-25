// src/services/firestoreService.ts
import { db } from '@/firebase'; 
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { AnalysisReport } from '@/types';

const REPORTS_COLLECTION = 'analysisReports'; // Firestore collection name

// Interface for the data as it's stored in Firestore, including our timestamp
interface StoredAnalysisReport extends AnalysisReport {
  fetchedAt: Timestamp;
}

export const getAnalysisReportFromFirestore = async (dateString: string): Promise<AnalysisReport | null> => {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, dateString);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as StoredAnalysisReport; 
      // The 'date' field in AnalysisReport is already a string (humanReadableDate).
      // The 'fetchedAt' field is a Firestore Timestamp. We don't need to convert it back to a JS Date
      // unless we specifically need to use it in the client with Date methods.
      // For now, we return the data as AnalysisReport, which excludes fetchedAt for the app's direct use.
      console.log(`Report for ${dateString} successfully retrieved from Firestore.`);
      
      // Ensure all fields expected by AnalysisReport are present, especially nested ones.
      // This is a basic check; more thorough validation could be added.
      if (!data.recommendations) {
          console.warn(`Firestore data for ${dateString} is missing 'recommendations'.`);
          return null; // Or handle as corrupted data
      }

      return data as AnalysisReport; 
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
    console.warn(`Attempted to save an empty or incomplete report for ${dateString} to Firestore. Skipping save.`);
    return;
  }
  try {
    const reportWithTimestamp: StoredAnalysisReport = {
      ...report,
      fetchedAt: Timestamp.now(), 
    };
    const docRef = doc(db, REPORTS_COLLECTION, dateString);
    await setDoc(docRef, reportWithTimestamp);
    console.log(`Report for ${dateString} successfully saved to Firestore.`);
  } catch (error) {
    console.error(`Error saving report for ${dateString} to Firestore:`, error);
  }
};