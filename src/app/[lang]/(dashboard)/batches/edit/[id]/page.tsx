"use client"

import { useEffect, useState } from "react"

import type { SSCType } from "@/types/sectorskills/sscType"

import type { batches, schemes, users } from "@prisma/client"

import Grid from "@mui/material/Grid"
import AddEditBatchForm from "@/views/batches/addEditForm"
import SkeletonForm from "@/components/skeleton/SkeletonForm"
import { QPType } from "@/types/qualification-pack/qpType"
import { SchemesType } from "@/types/schemes/schemesType"

const AgencyCreateApp = ({ params }: { params: { id: string } }) => {
  // Vars
  const [ssc, setSSCData] = useState<SSCType[]>([]);
  const [tp, setTPData] = useState<users[]>([]);
  const [tc, setTCData] = useState<users[]>([]);
  const [schemes, setSchemesData] = useState<SchemesType[]>([]);
  const [batch, setBatchData] = useState<batches & {qualification_pack: QPType} | null>(null); // Initialize with null to indicate loading state
  const [loading, setLoading] = useState(true); // Track loading state

  const fetchData = async () => {
    try {
      const [sscResponse, tpResponse, schemesResponse, batchResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-partner`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/schemes`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${params.id}`)
      ]);

      if (!sscResponse.ok || !tpResponse.ok || !schemesResponse.ok || !batchResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const sscData = await sscResponse.json();
      const tpData = await tpResponse.json();
      const schemesData = await schemesResponse.json();
      const batchData = await batchResponse.json();

      const tcData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tc?tpId=${batchData.training_partner_id}`).then(function (response) { return response.json() });

      setSSCData(sscData);
      setTPData(tpData);
      setSchemesData(schemesData);
      setBatchData(batchData);
      setTCData(tcData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle errors if needed
    } finally {
      setLoading(false); // Set loading to false after fetching is complete
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  if (loading) {
    return <SkeletonForm />; // Show skeleton form while loading
  }

  return (
    <Grid item xs={12}>
      {batch ? (
        <AddEditBatchForm id={batch.id} data={batch} sscData={ssc} tpData={tp} schemesData={schemes} trainingCenters={tc} />
      ) : (
        <SkeletonForm /> // Handle case where batch data is not found
      )}
    </Grid>
  );
};

export default AgencyCreateApp;
