import { useState, useEffect } from 'react';

/**
 * Hook customizado para buscar a lista de cursos disponíveis do PAVE
 * 
 * @returns {{
 *   cursos: Array,
 *   isLoading: boolean,
 *   error: string | null
 * }}
 */
const useCursos = () => {
    const [cursos, setCursos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCursos = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // URL pública do R2 para cursos.json
                const publicR2Url = 'https://pub-bb3996c786cd4543b2f53acdabbd9915.r2.dev/cursos.json';

                console.log(`Buscando cursos de: ${publicR2Url}`);

                const response = await fetch(publicR2Url, {
                    cache: 'no-cache' // Evita cache durante testes
                });

                if (!response.ok) {
                    console.error(`Erro ao carregar cursos: ${response.status} ${response.statusText}`);
                    const errorBody = await response.text();
                    console.error("Corpo da resposta de erro:", errorBody);
                    throw new Error(`Erro ${response.status} ao buscar cursos.`);
                }

                const data = await response.json();
                setCursos(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Falha ao buscar/processar cursos.json do R2:", error);
                setError("Não foi possível carregar a lista de cursos.");
                setCursos([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCursos();
    }, []); // Executa apenas uma vez na montagem

    return { cursos, isLoading, error };
};

export default useCursos;
