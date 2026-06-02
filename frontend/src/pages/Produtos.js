import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProdutoCard from '../components/ProdutoCard';

export default function Produtos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categorias, setCategorias]  = useState([]);
  const [produtos, setProdutos]      = useState([]);
  const [total, setTotal]            = useState(0);
  const [loading, setLoading]        = useState(true);
  const [pagina, setPagina]          = useState(1);

  // Captura os parâmetros reativos da URL
  const busca        = searchParams.get('busca')        || '';
  const categoria_id = searchParams.get('categoria_id') || '';
  const ordem        = searchParams.get('ordem')        || 'recentes';
  const freteGratis  = searchParams.get('frete_gratis') || '';
  const condicao     = searchParams.get('condicao')     || '';

  // Carrega as categorias apenas uma vez ao montar o componente
  useEffect(() => {
    api.get('/categorias')
      .then(({ data }) => setCategorias(data))
      .catch(err => console.error("Erro ao carregar categorias", err));
  }, []);

  // Faz a chamada à API sempre que QUALQUER filtro ou a página mudar
  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams({ limite: 12, pagina });
    
    if (busca)         params.set('busca', busca);
    if (categoria_id)  params.set('categoria_id', categoria_id);
    if (ordem)         params.set('ordem', ordem);
    if (freteGratis)   params.set('frete_gratis', freteGratis);
    if (condicao)      params.set('condicao', condicao);

    api.get(`/produtos?${params.toString()}`)
      .then(({ data }) => { 
        setProdutos(data.produtos || []); 
        setTotal(data.total || 0); 
      })
      .catch(() => {
        setProdutos([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [busca, categoria_id, ordem, freteGratis, condicao, pagina]);

  // Função utilitária para aplicar os filtros na URL preservando os outros
  const setFiltro = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    
    // Se trocou de categoria, limpa a busca por texto e vice-versa para não chocar
    if (key === 'categoria_id') next.delete('busca');
    if (key === 'busca')        next.delete('categoria_id');
    
    setSearchParams(next);
    setPagina(1); // Reseta para a primeira página ao filtrar
  };

  const catSelecionada = categorias.find(c => String(c.id) === String(categoria_id));
  const totalPag = Math.ceil(total / 12);

  const tituloResultado = () => {
    if (catSelecionada) return `${catSelecionada.icone || '📁'} ${catSelecionada.nome}`;
    if (busca)          return `Resultados para "${busca}"`;
    return 'Todos os Produtos';
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div style={styles.layout}>
        
        {/* Sidebar de Filtros */}
        <aside style={styles.sidebar}>
          <h3 style={styles.filterTitle}>Filtros</h3>

          {/* Categorias */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Categoria</label>
            <div style={styles.catList}>
              <button
                onClick={() => setFiltro('categoria_id', '')}
                style={{ ...styles.catBtn, ...(categoria_id === '' ? styles.catBtnAtivo : {}) }}
              >
                Todas
              </button>
              {categorias.map(c => (
                <button
                  key={c.id}
                  onClick={() => setFiltro('categoria_id', c.id)}
                  style={{ ...styles.catBtn, ...(String(categoria_id) === String(c.id) ? styles.catBtnAtivo : {}) }}
                >
                  {c.icone} {c.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Ordenar por</label>
            <select value={ordem} onChange={e => setFiltro('ordem', e.target.value)} style={styles.select}>
              <option value="recentes">Mais recentes</option>
              <option value="preco_asc">Menor preço</option>
              <option value="preco_desc">Maior preço</option>
              <option value="mais_vendidos">Mais vendidos</option>
            </select>
          </div>

          {/* Condição */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Condição</label>
            <select value={condicao} onChange={e => setFiltro('condicao', e.target.value)} style={styles.select}>
              <option value="">Todos</option>
              <option value="novo">Novo</option>
              <option value="usado">Usado</option>
              <option value="recondicionado">Recondicionado</option>
            </select>
          </div>

          {/* Frete Grátis */}
          <div style={styles.filterGroup}>
            <label style={{ ...styles.filterLabel, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={freteGratis === 'true'}
                onChange={e => setFiltro('frete_gratis', e.target.checked ? 'true' : '')}
              />
              Frete grátis
            </label>
          </div>

          {/* Botão de Limpar */}
          {(categoria_id || busca || condicao || freteGratis) && (
            <button
              onClick={() => { setSearchParams({}); setPagina(1); }}
              style={styles.limparBtn}
            >
              ✕ Limpar filtros
            </button>
          )}
        </aside>

        {/* Área de Conteúdo dos Produtos */}
        <div style={{ flex: 1 }}>
          <div style={styles.header}>
            <h2 style={styles.titulo}>{tituloResultado()}</h2>
            <span style={styles.totalLabel}>{total} produto{total !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : produtos.length === 0 ? (
            <div style={styles.vazio}>
              <p style={{ fontSize: 48 }}>🔍</p>
              <p style={{ marginTop: 12, fontWeight: 600 }}>Nenhum produto encontrado</p>
              {(categoria_id || busca || condicao || freteGratis) && (
                <button onClick={() => { setSearchParams({}); setPagina(1); }} style={{ ...styles.limparBtn, marginTop: 16, maxWidth: 200, margin: '16px auto 0' }}>
                  Ver todos os produtos
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={styles.grid}>
                {produtos.map(p => <ProdutoCard key={p.id} produto={p} />)}
              </div>
              
              {/* Paginação */}
              {totalPag > 1 && (
                <div style={styles.paginacao}>
                  {Array.from({ length: totalPag }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPagina(p)}
                      style={{ ...styles.pgBtn, ...(p === pagina ? styles.pgBtnAtivo : {}) }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout:      { display: 'flex', gap: 24, alignItems: 'flex-start' },
  sidebar:     { width: 230, background: 'var(--cinza-card)', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--sombra)', flexShrink: 0, position: 'sticky', top: 90 },
  filterTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--texto)' },
  filterGroup: { marginBottom: 18 },
  filterLabel: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--texto-suave)' },
  catList:     { display: 'flex', flexDirection: 'column', gap: 4 },
  catBtn:      { background: 'transparent', border: '1px solid var(--borda)', borderRadius: 6, padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: 13, color: 'var(--texto-suave)', fontWeight: 500, transition: 'all .15s' },
  catBtnAtivo: { background: '#FFF0E6', borderColor: 'var(--laranja)', color: 'var(--laranja)', fontWeight: 700 },
  select:      { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--borda)', fontSize: 13, background: '#fff', color: 'var(--texto)', outline: 'none' },
  limparBtn:   { width: '100%', background: 'transparent', border: '1px solid var(--borda)', borderRadius: 6, padding: '8px 0', color: 'var(--texto-suave)', fontSize: 13, cursor: 'pointer', fontWeight: 600, display: 'block' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo:      { fontSize: 22, fontWeight: 700, fontFamily: "'Sora', sans-serif" },
  totalLabel:  { color: 'var(--texto-suave)', fontSize: 14 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  vazio:       { textAlign: 'center', padding: '80px 0', color: 'var(--texto-suave)', background: 'var(--cinza-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--sombra)' },
  paginacao:   { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 },
  pgBtn:       { padding: '8px 14px', border: '1px solid var(--borda)', borderRadius: 6, background: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600, color: 'var(--texto-suave)' },
  pgBtnAtivo:  { background: 'var(--laranja)', color: '#fff', borderColor: 'var(--laranja)' },
};
