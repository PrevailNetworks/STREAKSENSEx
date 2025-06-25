// src/services/firestoreService.ts
import { db } from '@/firebase'; 
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { AnalysisReport } from '@/types';

const REPORTS_COLLECTION = 'analysisReports'; // Firestore collection name

// Interface for the data as it's stored in Firestore, including our timestamp
interface StoredAnalysisReport extends AnalysisReport {
  fetchedAt: Timestamp;
}

export interface FirestoreReportWithTimestamp {
  report: AnalysisReport;
  fetchedAt: Date;
}

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
      // Convert Firestore Timestamp to JavaScript Date object
      const fetchedAtJSDate = data.fetchedAt.toDate();
      
      // Return the main report data and the JS Date version of fetchedAt
      return { report: data as AnalysisReport, fetchedAt: fetchedAtJSDate };
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