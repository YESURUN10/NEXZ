import React from 'react';
import KnowledgeNetwork from './KnowledgeNetwork';

/**
 * Replaced the rotating sphere with the KnowledgeNetwork intelligence graph.
 * Kept for backward-compatible component imports.
 */
export default function HeroGlobe(props) {
  return <KnowledgeNetwork {...props} />;
}
