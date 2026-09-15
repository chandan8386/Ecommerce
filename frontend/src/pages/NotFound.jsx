import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { EmptyState } from '../components/ui/index.jsx';

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" noindex />
      <EmptyState title="Page not found" message="The page you're looking for has moved or doesn't exist." action={<Link to="/" className="btn-primary">Back to home</Link>} />
    </>
  );
}
