
import React from 'react';
import { masterSpecification } from '../components/Sidebar';
import { Card } from '../components/ui/Card';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';

const SpecificationViewer: React.FC = () => {
  const formatContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-primary font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-on-surface flex items-center gap-4">
          <DocumentTextIcon className="w-10 h-10 text-primary" />
          {masterSpecification.prompt_title}
        </h1>
        <p className="text-lg text-on-surface-variant">{masterSpecification.prompt_introduction}</p>
      </div>
      
      <div className="space-y-8">
        {masterSpecification.specifications.map((spec) => (
          <Card key={spec.point_number} className="p-6 border-l-4 border-primary/50">
            <h2 className="text-2xl font-bold text-on-surface mb-3">
              <span className="text-primary mr-2">{spec.point_number}.</span> {spec.title}
            </h2>
            <div className="text-on-surface-variant space-y-4 leading-relaxed">
              <p>{formatContent(spec.content)}</p>
            </div>
            {spec.key_concepts && spec.key_concepts.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-semibold text-on-surface mb-3">Key Concepts:</h4>
                    <div className="flex flex-wrap gap-2">
                        {spec.key_concepts.map(concept => (
                            <span key={concept} className="px-3 py-1 text-sm font-mono bg-surface text-primary rounded-full border border-border-color">
                                {concept}
                            </span>
                        ))}
                    </div>
                </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SpecificationViewer;