import { ReactNode, ElementType } from 'react';

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  icon?: ElementType;
  actions?: ReactNode;
  variant?: 'full' | 'split';
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  variant = 'full',
  children,
}: PageHeaderProps) {
  if (variant === 'split') {
    return (
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-border bg-gray-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold tracking-tight text-gray-text flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 text-primary" />}
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-body text-gray-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    );
  }

  // Full variant
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1 font-bold tracking-tight text-gray-text flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-body text-gray-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
