import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { breakpoints } from '../../styles/breakpoints';
import {
  DEFAULT_DOC_ID,
  DOCS_NAV,
  DOCS_ORDER,
  DOC_PAGES,
  resolveDocId,
} from '../../docs/docsContent';

/**
 * RAPHA customer documentation shell: responsive sidebar + mobile menu,
 * breadcrumb, and previous/next navigation. Sub-pages are hash-routed as
 * `#/docs/<pageId>` and this component listens for hash changes so deep links
 * and in-page navigation both work. No documentation framework is used.
 */

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 96px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['3xl']};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  ${breakpoints.tablet} {
    grid-template-columns: 260px 1fr;
    padding: 120px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Sidebar = styled.nav<{ $open: boolean }>`
  ${breakpoints.tablet} {
    display: block;
    position: sticky;
    top: 96px;
    align-self: start;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const SidebarInner = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.card};
`;

const DocsTitle = styled.p`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.primary.main};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

const SectionTitle = styled.p`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: ${({ theme }) => theme.spacing.md} 0 6px;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  padding: 0;
`;

const NavLink = styled.a<{ $active: boolean }>`
  display: block;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.neutral.white : theme.colors.neutral.lightGray};
  background: ${({ $active }) => ($active ? 'rgba(0, 240, 255, 0.12)' : 'transparent')};
  border-left: 3px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary.main : 'transparent')};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    background: rgba(255, 255, 255, 0.04);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 2px;
  }
`;

const MobileToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary.main};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  ${breakpoints.tablet} {
    display: none;
  }
`;

const Content = styled.article`
  min-width: 0;
`;

const Breadcrumb = styled.nav`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  a {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: ${({ theme }) => theme.colors.primary.main};
    }
  }

  span[aria-hidden='true'] {
    margin: 0 8px;
    opacity: 0.6;
  }
`;

const PrevNext = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const PrevNextLink = styled.a`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  cursor: pointer;
  max-width: 48%;

  &:hover {
    text-shadow: 0 0 8px ${({ theme }) => theme.colors.primary.glow};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 2px;
  }

  small {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
  }
`;

function docIdFromHash(): string {
  const match = window.location.hash.match(/^#\/docs\/?([^/?#]*)/i);
  return resolveDocId(match ? match[1] : DEFAULT_DOC_ID);
}

export function DocsPage() {
  const [activeId, setActiveId] = useState<string>(() => docIdFromHash());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setActiveId(docIdFromHash());
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const page = DOC_PAGES[activeId];

  useEffect(() => {
    document.title = `${page.title} — RAPHA Documentation — EmmaTech`;
  }, [page.title]);

  const goToDoc = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = id === DEFAULT_DOC_ID ? '#/docs' : `#/docs/${id}`;
  };

  const index = DOCS_ORDER.indexOf(activeId);
  const prevId = index > 0 ? DOCS_ORDER[index - 1] : null;
  const nextId = index >= 0 && index < DOCS_ORDER.length - 1 ? DOCS_ORDER[index + 1] : null;

  return (
    <Page>
      <div>
        <MobileToggle
          type="button"
          aria-expanded={menuOpen}
          aria-controls="docs-sidebar"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? 'Hide' : 'Browse'} documentation
        </MobileToggle>
        <Sidebar id="docs-sidebar" $open={menuOpen} aria-label="Documentation">
          <SidebarInner>
            <DocsTitle>RAPHA Documentation</DocsTitle>
            {DOCS_NAV.map((section) => (
              <div key={section.title}>
                <SectionTitle>{section.title}</SectionTitle>
                <NavList>
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        href={item.id === DEFAULT_DOC_ID ? '#/docs' : `#/docs/${item.id}`}
                        $active={item.id === activeId}
                        aria-current={item.id === activeId ? 'page' : undefined}
                        onClick={goToDoc(item.id)}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </NavList>
              </div>
            ))}
          </SidebarInner>
        </Sidebar>
      </div>

      <Content>
        <Breadcrumb aria-label="Breadcrumb">
          <a href="#/docs" onClick={goToDoc(DEFAULT_DOC_ID)}>
            Documentation
          </a>
          <span aria-hidden="true">/</span>
          <span>{page.section}</span>
          <span aria-hidden="true">/</span>
          <span>{page.title}</span>
        </Breadcrumb>

        {page.body}

        <PrevNext>
          {prevId ? (
            <PrevNextLink href={`#/docs/${prevId}`} onClick={goToDoc(prevId)}>
              <small>Previous</small>
              {DOC_PAGES[prevId].title}
            </PrevNextLink>
          ) : (
            <span />
          )}
          {nextId ? (
            <PrevNextLink
              href={`#/docs/${nextId}`}
              onClick={goToDoc(nextId)}
              style={{ textAlign: 'right' }}
            >
              <small>Next</small>
              {DOC_PAGES[nextId].title}
            </PrevNextLink>
          ) : (
            <span />
          )}
        </PrevNext>
      </Content>
    </Page>
  );
}
