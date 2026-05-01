"use server"

import updateCandidateResultStatus from "@/libs/UpdateCandidateResultStatus";

export async function handleUpdateResult(studentId: number) {

  try {

    const result = await updateCandidateResultStatus(studentId);

    console.log("Updated Result:", result);

    return result;

  } catch (error) {
    console.error(error);
  }
}
