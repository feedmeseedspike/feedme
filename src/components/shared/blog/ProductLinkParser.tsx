"use client";

import { useState, useEffect } from 'react';

interface ProductMatch {
  name: string;
  slug: string;
  type: 'product' | 'bundle' | 'offer';
  url: string;
}

interface ProductLinkParserProps {
  content: string;
  className?: string;
}

export default function ProductLinkParser({ content, className = '' }: ProductLinkParserProps) {
  const [processedContent, setProcessedContent] = useState(content);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processProductLinks = async () => {
      try {
        // Find all [[product-slug]] or [[product-slug|custom-text]] patterns
        const bracketPattern = /\[\[([^\]]+)\]\]/g;
        const matches = content.match(bracketPattern);
        
        if (!matches || matches.length === 0) {
          setProcessedContent(content);
          setLoading(false);
          return;
        }

        // Extract slugs and custom text from brackets
        const slugsAndText = matches.map(match => {
          const inner = match.replace(/\[\[|\]\]/g, '');
          const [slug, customText] = inner.split('|');
          return { slug: slug.trim(), customText: customText?.trim(), fullMatch: match };
        });
        
        const slugs = slugsAndText.map(item => item.slug);
        
        // Fetch product data for these slugs
        const response = await fetch('/api/blog/product-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs })
        });

        const data = await response.json();
        let modifiedContent = content;
        
        if (data.success && data.matches.length > 0) {
          // Replace each [[slug]] or [[slug|text]] with actual product link
          data.matches.forEach((match: ProductMatch) => {
            // Find matching slugsAndText entries for this product
            const matchingEntries = slugsAndText.filter(item => item.slug === match.slug);
            
            matchingEntries.forEach(entry => {
              // Use custom text if provided, otherwise use product name
              const displayText = entry.customText || match.name;
              
              const productLink = `<a href="${match.url}" class="product-link inline-flex items-center gap-1 text-[#1B6013] font-semibold hover:text-[#F0800F] transition-colors duration-200 underline decoration-2 decoration-[#1B6013] hover:decoration-[#F0800F]" data-product-type="${match.type}" title="View ${match.name} - ${match.type}">${displayText} <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
              
              // Replace the specific full match (including any custom text)
              modifiedContent = modifiedContent.replace(entry.fullMatch, productLink);
            });
          });
        }
        
        // Remove any unmatched brackets (products that don't exist)
        modifiedContent = modifiedContent.replace(/\[\[([^\]]+)\]\]/g, '$1');
        
        setProcessedContent(modifiedContent);
      } catch (error) {
        console.error('Error processing product links:', error);
        // Remove brackets from unprocessed content
        setProcessedContent(content.replace(/\[\[([^\]]+)\]\]/g, '$1'));
      } finally {
        setLoading(false);
      }
    };

    processProductLinks();
  }, [content]);

  if (loading) {
    return (
      <div className={`prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#F0800F] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-xl prose-blockquote:border-l-[#1B6013] prose-blockquote:bg-green-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div 
      className={`prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#F0800F] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-xl prose-blockquote:border-l-[#1B6013] prose-blockquote:bg-green-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}