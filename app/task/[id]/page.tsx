'use client';

import { use, useEffect } from 'react';
import { useApp } from '@/lib/client/store';
import MyTasksPage from '@/app/page';

// Deep-link target for every notification. Opens the task drawer over the
// default view once data has loaded.
export default function TaskDeepLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loaded, openTask } = useApp();

  useEffect(() => {
    if (loaded) openTask(id);
  }, [loaded, id, openTask]);

  return <MyTasksPage />;
}
