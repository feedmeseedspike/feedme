// Utility functions for careers functionality

export function createJobSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getDepartments() {
  return [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Operations',
    'Customer Success',
    'Finance',
    'Human Resources',
    'Legal'
  ];
}