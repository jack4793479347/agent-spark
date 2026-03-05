'use client';

import { AgentCard, type AgentCardData } from './AgentCard';
import { SkeletonGrid } from '@/components/shared/LoadingStates';
import { cn } from '@/lib/utils';

interface AgentGridProps {
  agents: AgentCardData[];
  loading?: boolean;
  className?: string;
}

export function AgentGrid({ agents, loading, className }: AgentGridProps) {
  if (loading) {
    return <SkeletonGrid count={9} />;
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="font-heading text-lg font-semibold text-text-primary mb-1">
          No agents found
        </h3>
        <p className="text-text-secondary text-sm max-w-sm">
          Try adjusting your search or filters to find the right agent for your needs.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5',
      className
    )}>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
