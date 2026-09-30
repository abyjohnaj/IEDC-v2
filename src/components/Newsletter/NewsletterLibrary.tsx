import React, { useState, useEffect } from 'react';
import { NewsletterEdition } from '../../types';
import { newsletterService } from '../../services/newsletterService';
import { RotatingBookshelf } from './RotatingBookshelf';
import { NewsletterDetails } from './NewsletterDetails';
import { NewsletterReader } from './NewsletterReader';
import { Sparkles, Library } from 'lucide-react';
import '../../styles/rotatingBookshelf.css';

export const NewsletterLibrary: React.FC = () => {
  const [editions, setEditions] = useState<NewsletterEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<NewsletterEdition | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load editions via service layer
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const allEditions = await newsletterService.getAllNewsletters();
      const uniqueCats = await newsletterService.getAvailableCategories();
      setEditions(allEditions);
      setCategories(['All', ...uniqueCats]);
      // Default select the latest edition (top tier, front facing)
      if (allEditions.length > 0) {
        setSelectedEdition(allEditions[0]);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter editions if user selects a category, or keep all on shelf
  const displayedEditions = selectedCategory === 'All'
    ? editions
    : editions.filter(ed => ed.category === selectedCategory);

  // Index of currently selected edition among displayed list
  const currentIdx = selectedEdition
    ? displayedEditions.findIndex(e => e.id === selectedEdition.id)
    : -1;

  const handlePrevEdition = () => {
    if (displayedEditions.length === 0) return;
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : displayedEditions.length - 1;
    setSelectedEdition(displayedEditions[nextIdx]);
  };

  const handleNextEdition = () => {
    if (displayedEditions.length === 0) return;
    const nextIdx = currentIdx < displayedEditions.length - 1 ? currentIdx + 1 : 0;
    setSelectedEdition(displayedEditions[nextIdx]);
  };

  return (
    <div className="library-room" role="main" aria-label="Interactive 3D Revolving Newsletter Library">
      {/* Ambient Overhead Chandelier Spotlight */}
      <div className="library-spotlight" />


      {/* Persian Medallion Rug Underneath Bookshelf */}
      <div className="library-persian-rug" />
      <div className="bookshelf-carpet-shadow" />
      <div className="library-floor-reflection" />

      {/* Editorial Room Header */}
      <header className="library-header">
        <div className="library-curator-badge">
          <Sparkles size={14} style={{ color: '#f59e0b' }} />
          <span>Handcrafted 3D Revolving Archive</span>
        </div>

        <h1 className="library-title">Newsletter Library</h1>

        <p className="library-subtitle">
          Explore every issue. Rotate the shelf. Pick a story.
        </p>

        {/* Category Filters */}
        <div className="library-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`library-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* 3D Cylindrical Bookshelf Stage */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#fcd34d' }}>
          Restoring Archive Volumes...
        </div>
      ) : (
        <RotatingBookshelf
          editions={displayedEditions}
          selectedEdition={selectedEdition}
          onSelectEdition={(edition) => setSelectedEdition(edition)}
          radius={175}
        />
      )}

      {/* Selected Book Details Panel */}
      {selectedEdition && (
        <NewsletterDetails
          edition={selectedEdition}
          onRead={() => setIsReaderOpen(true)}
          onDismiss={() => setSelectedEdition(null)}
        />
      )}

      {/* Interactive Editorial Newsletter Reader */}
      {isReaderOpen && selectedEdition && (
        <NewsletterReader
          edition={selectedEdition}
          onClose={() => setIsReaderOpen(false)}
          onPrevEdition={handlePrevEdition}
          onNextEdition={handleNextEdition}
          hasPrev={displayedEditions.length > 1}
          hasNext={displayedEditions.length > 1}
        />
      )}
    </div>
  );
};
