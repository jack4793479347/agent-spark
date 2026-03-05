'use client';

/* This page now redirects to the main creator home which has the agent list */
import { redirect } from 'next/navigation';

export default function CreatorListingsPage() {
  redirect('/creator');
}
