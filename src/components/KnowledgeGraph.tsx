'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { KnowledgeEntity, EntityRelationship, EntityType } from '@/types/database';

// ---------------------------------------------------------------------------
// KnowledgeGraph -- SVG network visualization of a book's entity graph
// ---------------------------------------------------------------------------

interface KnowledgeGraphProps {
  bookId: string;
}

interface PositionedEntity extends KnowledgeEntity {
  x: number;
  y: number;
}

// Entity type -> circle fill color (using CSS custom property values directly)
const ENTITY_COLORS: Record<EntityType, string> = {
  person: '#c4a265',   // rune-gold
  place: '#4ecdc4',    // rune-teal
  theme: '#7a6c58',    // rune-muted
  event: '#ebe1d4',    // rune-heading (near-white)
};

const ENTITY_LABELS: Record<EntityType, string> = {
  person: 'Person',
  place: 'Place',
  theme: 'Theme',
  event: 'Event',
};

const NODE_RADIUS = 20;
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const PADDING = 60;

/**
 * Simple force-directed-ish layout: place entities on a grid, then pull
 * connected entities closer together via a few relaxation passes.
 */
function layoutEntities(
  entities: KnowledgeEntity[],
  relationships: EntityRelationship[],
): PositionedEntity[] {
  if (entities.length === 0) return [];

  // Build adjacency set for fast lookup
  const adjacency = new Map<string, Set<string>>();
  for (const rel of relationships) {
    if (!adjacency.has(rel.from_entity_id)) adjacency.set(rel.from_entity_id, new Set());
    if (!adjacency.has(rel.to_entity_id)) adjacency.set(rel.to_entity_id, new Set());
    adjacency.get(rel.from_entity_id)!.add(rel.to_entity_id);
    adjacency.get(rel.to_entity_id)!.add(rel.from_entity_id);
  }

  // Initial grid placement
  const cols = Math.max(1, Math.ceil(Math.sqrt(entities.length)));
  const usableW = SVG_WIDTH - PADDING * 2;
  const usableH = SVG_HEIGHT - PADDING * 2;
  const cellW = usableW / cols;
  const cellH = usableH / Math.max(1, Math.ceil(entities.length / cols));

  const positions: PositionedEntity[] = entities.map((e, i) => ({
    ...e,
    x: PADDING + (i % cols) * cellW + cellW / 2,
    y: PADDING + Math.floor(i / cols) * cellH + cellH / 2,
  }));

  // Relaxation: pull connected nodes closer, push overlapping nodes apart
  const posMap = new Map<string, PositionedEntity>();
  for (const p of positions) posMap.set(p.id, p);

  for (let iter = 0; iter < 30; iter++) {
    // Attraction: connected entities pull toward each other
    for (const rel of relationships) {
      const a = posMap.get(rel.from_entity_id);
      const b = posMap.get(rel.to_entity_id);
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) continue;

      const force = (dist - 80) * 0.02;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      a.x += fx;
      a.y += fy;
      b.x -= fx;
      b.y -= fy;
    }

    // Repulsion: keep nodes from overlapping
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = NODE_RADIUS * 4;

        if (dist < minDist && dist > 0.1) {
          const push = (minDist - dist) * 0.3;
          const px = (dx / dist) * push;
          const py = (dy / dist) * push;
          a.x -= px;
          a.y -= py;
          b.x += px;
          b.y += py;
        }
      }
    }

    // Clamp to bounds
    for (const p of positions) {
      p.x = Math.max(PADDING, Math.min(SVG_WIDTH - PADDING, p.x));
      p.y = Math.max(PADDING, Math.min(SVG_HEIGHT - PADDING, p.y));
    }
  }

  return positions;
}

export default function KnowledgeGraph({ bookId }: KnowledgeGraphProps) {
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();

      const [entitiesResult, relationshipsResult] = await Promise.all([
        supabase
          .from('knowledge_entities')
          .select('*')
          .eq('book_id', bookId)
          .order('mention_count', { ascending: false }),
        supabase
          .from('entity_relationships')
          .select('*')
          .eq('book_id', bookId),
      ]);

      if (cancelled) return;

      setEntities((entitiesResult.data ?? []) as KnowledgeEntity[]);
      setRelationships((relationshipsResult.data ?? []) as EntityRelationship[]);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [bookId]);

  // Layout
  const positioned = useMemo(
    () => layoutEntities(entities, relationships),
    [entities, relationships],
  );

  const positionMap = useMemo(() => {
    const map = new Map<string, PositionedEntity>();
    for (const p of positioned) map.set(p.id, p);
    return map;
  }, [positioned]);

  // Selected entity details
  const selected = useMemo(
    () => (selectedId ? positionMap.get(selectedId) ?? null : null),
    [selectedId, positionMap],
  );

  const selectedRelationships = useMemo(() => {
    if (!selectedId) return [];
    return relationships.filter(
      (r) => r.from_entity_id === selectedId || r.to_entity_id === selectedId,
    );
  }, [selectedId, relationships]);

  const handleEntityClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBackdropClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border p-12"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <span className="label-mono">Loading knowledge graph...</span>
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border p-12 text-center"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <p
          className="mb-1 font-serif text-lg"
          style={{ color: 'var(--rune-heading)' }}
        >
          No entities yet
        </p>
        <p className="text-sm" style={{ color: 'var(--rune-muted)' }}>
          Start a conversation and Rune will build the knowledge graph as you talk.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SVG Graph */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{
          backgroundColor: 'var(--rune-surface)',
          borderColor: 'var(--rune-border)',
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full"
          style={{ maxHeight: '500px' }}
          role="img"
          aria-label="Knowledge graph showing entities and their relationships"
        >
          {/* Click backdrop to deselect */}
          <rect
            x="0"
            y="0"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            fill="transparent"
            onClick={handleBackdropClick}
          />

          {/* Relationship lines */}
          {relationships.map((rel) => {
            const from = positionMap.get(rel.from_entity_id);
            const to = positionMap.get(rel.to_entity_id);
            if (!from || !to) return null;

            const isHighlighted =
              selectedId === rel.from_entity_id || selectedId === rel.to_entity_id;

            return (
              <line
                key={rel.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#c4a265' : '#4a3d30'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={selectedId && !isHighlighted ? 0.2 : 0.6}
              />
            );
          })}

          {/* Entity nodes */}
          {positioned.map((entity) => {
            const isSelected = selectedId === entity.id;
            const isConnected = selectedId
              ? relationships.some(
                  (r) =>
                    (r.from_entity_id === selectedId && r.to_entity_id === entity.id) ||
                    (r.to_entity_id === selectedId && r.from_entity_id === entity.id),
                )
              : false;
            const isDimmed = selectedId !== null && !isSelected && !isConnected;

            return (
              <g
                key={entity.id}
                onClick={() => handleEntityClick(entity.id)}
                style={{ cursor: 'pointer' }}
                opacity={isDimmed ? 0.3 : 1}
              >
                {/* Node circle */}
                <circle
                  cx={entity.x}
                  cy={entity.y}
                  r={NODE_RADIUS}
                  fill={ENTITY_COLORS[entity.entity_type]}
                  fillOpacity={0.85}
                  stroke={isSelected ? '#ebe1d4' : 'transparent'}
                  strokeWidth={isSelected ? 2.5 : 0}
                />

                {/* Mention count badge */}
                {entity.mention_count > 1 && (
                  <>
                    <circle
                      cx={entity.x + NODE_RADIUS * 0.7}
                      cy={entity.y - NODE_RADIUS * 0.7}
                      r={8}
                      fill="#2a1f18"
                      stroke={ENTITY_COLORS[entity.entity_type]}
                      strokeWidth={1}
                    />
                    <text
                      x={entity.x + NODE_RADIUS * 0.7}
                      y={entity.y - NODE_RADIUS * 0.7}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9"
                      fill="#d4c5b0"
                      fontFamily="var(--font-mono)"
                    >
                      {entity.mention_count}
                    </text>
                  </>
                )}

                {/* Label below circle */}
                <text
                  x={entity.x}
                  y={entity.y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#d4c5b0"
                  fontFamily="var(--font-sans)"
                >
                  {entity.name.length > 16
                    ? entity.name.slice(0, 14) + '...'
                    : entity.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div
          className="flex items-center gap-5 px-4 py-2"
          style={{ borderTop: '1px solid var(--rune-border)' }}
        >
          {(Object.keys(ENTITY_COLORS) as EntityType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: ENTITY_COLORS[type] }}
              />
              <span className="label-mono">{ENTITY_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="rounded-lg border p-5"
          style={{
            backgroundColor: 'var(--rune-surface)',
            borderColor: 'var(--rune-border)',
          }}
        >
          <div className="mb-3 flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: ENTITY_COLORS[selected.entity_type] }}
            />
            <h3
              className="font-serif text-lg"
              style={{ color: 'var(--rune-heading)' }}
            >
              {selected.name}
            </h3>
            <span className="label-mono">{ENTITY_LABELS[selected.entity_type]}</span>
          </div>

          {selected.description && (
            <p className="mb-3 text-sm" style={{ color: 'var(--rune-text)' }}>
              {selected.description}
            </p>
          )}

          <div className="mb-3 flex items-center gap-4">
            <span className="label-mono">
              {selected.mention_count} mention{selected.mention_count !== 1 ? 's' : ''}
            </span>
          </div>

          {selectedRelationships.length > 0 && (
            <div>
              <p className="label-mono mb-2">Relationships</p>
              <ul className="flex flex-col gap-1">
                {selectedRelationships.map((rel) => {
                  const otherId =
                    rel.from_entity_id === selected.id
                      ? rel.to_entity_id
                      : rel.from_entity_id;
                  const other = positionMap.get(otherId);
                  const direction =
                    rel.from_entity_id === selected.id ? '-->' : '<--';

                  return (
                    <li
                      key={rel.id}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--rune-text)' }}
                    >
                      <span style={{ color: 'var(--rune-muted)' }}>
                        {direction}
                      </span>
                      <span style={{ color: 'var(--rune-gold)' }}>
                        {rel.relationship_type}
                      </span>
                      <span>{other?.name ?? 'Unknown'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
