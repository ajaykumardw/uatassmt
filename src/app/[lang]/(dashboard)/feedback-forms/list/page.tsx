"use client"

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { toast } from "react-toastify";

import NoRecords from "@/components/NoRecords";
import SkeletonTable from "@/components/skeleton/SkeletonTable";

import { getLocalizedUrl } from '@/utils/i18n'

import type { Locale } from "@/configs/i18n";
import FeedbackFormTable from "@/views/feedback-forms/FeedbackFormTable";

const FeedbackFormsPage = () => {
  const [loading, setLoading] = useState(true);
  const [feedbackForms, setFeedbackForms] = useState([]);
  const params = useParams();
  const { lang: locale } = params

  const fetchFeedbackForms = async () => {
    // You can add data fetching logic here if needed
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback_forms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: "no-store"
    });

    if (!res.ok) {
      toast.error('Failed to fetch feedback forms');
      setLoading(false);

      return;
    }

    const data = await res.json();

    setFeedbackForms(data.feedbackForms || []);
    setLoading(false);

    // Process the data as needed
  };

  useEffect(() => {
    // You can add data fetching logic here if needed
    fetchFeedbackForms();
  }, []);

  if(loading) {
    return <SkeletonTable />;
  } else {

    if(feedbackForms?.length === 0) {
      return (
        <NoRecords url={getLocalizedUrl('/feedback-forms/create', locale as Locale)}/>
      );
    }

    return (
      <FeedbackFormTable data={feedbackForms} />
    );
  }
};

export default FeedbackFormsPage
