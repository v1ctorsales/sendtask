import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaPlus } from "react-icons/fa";
import { BsPencilFill } from "react-icons/bs";
import { FaTrash } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { FaArrowRotateLeft } from "react-icons/fa6";

function EditableInterfaces() {
    const [localidades, setLocalidades] = useState([]);
    const [interfaces, setInterfaces] = useState([]);
    const [selectedLocalidade, setSelectedLocalidade] = useState('');
    const [newInterface, setNewInterface] = useState(''); // Estado para nova interface
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingInterfaces, setIsLoadingInterfaces] = useState(false); // Novo estado para carregar interfaces
    const [error, setError] = useState(null);
    const [editIndex, setEditIndex] = useState(null); // Estado para gerenciar qual item está sendo editado
    const [editedName, setEditedName] = useState(''); // Estado para armazenar o novo nome da interface
    const [isSaving, setIsSaving] = useState(false); // Estado para controlar a atividade de salvamento
    const [isFetchSuccessful, setIsFetchSuccessful] = useState(false); // Novo estado para controlar o sucesso da busca


    // Carrega as localidades ao montar o componente
    useEffect(() => {
        const fetchLocalidades = async () => {
            try {
                const response = await fetch('/api/getLocalidade');
                if (!response.ok) {
                    throw new Error('Erro ao buscar localidades');
                }
                const data = await response.json();
                setLocalidades(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLocalidades();
    }, []);

    // Carrega as interfaces da localidade selecionada
    useEffect(() => {
        if (selectedLocalidade) {
            const fetchInterfaces = async () => {
                try {
                    setIsLoadingInterfaces(true);
                    setInterfaces([]); // Limpa as interfaces antes de carregar as novas
                    const response = await fetch(`/api/getInterfaces?localidade=${selectedLocalidade}`);
                    if (!response.ok) {
                        setIsFetchSuccessful(false); // Define como falso se a resposta não for 200
                        throw new Error('Erro ao buscar interfaces');
                    }
                    const data = await response.json();
                    console.log('Interfaces recebidas do backend:', data); // Log das interfaces recebidas
                    setInterfaces(data);
                    setIsFetchSuccessful(true); // Define como verdadeiro se a resposta for 200
                } catch (err) {
                    setError(err.message);
                    setIsFetchSuccessful(false); // Define como falso se houver erro
                } finally {
                    setIsLoadingInterfaces(false);
                }
            };
    
            fetchInterfaces();
        } else {
            setIsFetchSuccessful(false); // Reseta o estado se nenhuma localidade estiver selecionada
        }
    }, [selectedLocalidade]);
    
    

    const MySwal = withReactContent(Swal);

    const handleDeleteClick = (index) => {
        const iface = interfaces[index];
        console.log('Tentando excluir interface:', iface.nome, 'na localidade:', selectedLocalidade);
    
        MySwal.fire({
            title: `Deseja excluir a interface ${iface.nome}?`,
            text: "Você não poderá reverter isso!",
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#a6a6a6',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Excluir'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('/api/deleteInterface', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nome: iface.nome,
                        localidade: selectedLocalidade,
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data));
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        const updatedInterfaces = interfaces.filter((_, i) => i !== index);
                        setInterfaces(updatedInterfaces);
                        toast.success(data.message);
                    } else {
                        toast.error(data.message || 'Erro ao excluir interface.');
                    }
                })
                .catch(error => {
                    console.error('Erro ao excluir interface:', error);
                    toast.error('Erro ao excluir interface: ' + (error.message || 'Erro desconhecido'));
                });
            }
        });
    };
    
    
    const handleAddClick = async () => {
        if (!newInterface.trim()) {
            toast.error("Por favor, insira um nome para a nova interface.");
            return;
        }
    
        if (!selectedLocalidade) {
            toast.error("Por favor, selecione uma localidade.");
            return;
        }
        
        setIsSaving(true);
        
        try {
            const response = await fetch('/api/sendNewInterface', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: newInterface.trim(),
                    localidade: selectedLocalidade.trim(),
                    empresa: 'empresa_teste', // Adiciona o nome da empresa hardcoded
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message || 'Erro ao adicionar interface');
                throw new Error(errorData.message || 'Erro ao adicionar interface');
            }
    
            const data = await response.json();
            toast.success('Interface adicionada com sucesso!');
            setInterfaces([...interfaces, { nome: newInterface.trim() }]);
            setNewInterface(''); // Limpa o campo de input após o sucesso
        } catch (err) {
            console.error('Erro ao adicionar interface:', err);
            toast.error('Erro ao adicionar interface: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    
    const handleEditClick = (index) => {
        setEditIndex(index);
        setEditedName(interfaces[index].nome); // Armazena o nome atual para edição
    };

    const handleCancelClick = () => {
        setEditIndex(null);
        setEditedName(''); // Reseta o nome editado ao cancelar
        setIsSaving(false); // Garante que o estado de salvamento seja redefinido
    };

    const handleSaveClick = async (index) => {
        setIsSaving(true); // Ativa o estado de salvamento
        const oldName = interfaces[index].nome; // Armazena o nome antigo para possíveis restaurações
        const newName = editedName;
    
        try {
            const response = await fetch('/api/updateInterface', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldName: oldName,
                    newName: newName,
                    localidade: selectedLocalidade,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    toast.error(errorData.message);
                    setEditedName(oldName); // Restaura o nome original no input se houver conflito
                } else {
                    toast.error(errorData.message);
                    throw new Error(errorData.message || 'Erro desconhecido ao salvar a interface');
                }
            } else {
                toast.success('Interface salva com sucesso!');
                // Atualiza a lista de interfaces com o novo nome
                const updatedInterfaces = [...interfaces];
                updatedInterfaces[index].nome = newName;
                setInterfaces(updatedInterfaces);
                setEditIndex(null); // Fecha o modo de edição em caso de sucesso
                setEditedName('');
            }
        } catch (err) {
            toast.error('Erro ao salvar interface: ' + err.message);
            setError(err.message);
        } finally {
            setIsSaving(false); // Desativa o estado de salvamento
        }
    };
    

    if (isLoading) {
        return <div className="center"><AiOutlineLoading3Quarters className="loading-icon" /></div>;
    }

    if (error) {
        return <div>Erro: {error}</div>;
    }

    return (
        <>
            <ToastContainer />
            <h3>Interfaces</h3>
            <div className="formDiv editableThing">
                <div className="divson" htmlFor="localidade" id="">Localidade</div>
                <select
                    id="localidade"
                    value={selectedLocalidade}
                    onChange={(e) => setSelectedLocalidade(e.target.value)}
                >
                    <option value="">Selecione uma localidade</option>
                    {localidades.map((localidade, index) => (
                        <option key={index} value={localidade.nome}>
                            {localidade.nome}
                        </option>
                    ))}
                </select>
            </div>
            {isLoadingInterfaces ? (
                <div className="centerDois"><AiOutlineLoading3Quarters className="loading-icon" /></div>
            ) : (
                selectedLocalidade && (
                    <>
                        <h3>Interfaces disponíveis em <span>{selectedLocalidade}</span></h3> {/* Novo h3 */}
                        {interfaces.map((iface, index) => (
                            <div key={index} className="EditableInterfaces">
                                <input
                                    className={`editableText ${editIndex === index ? '' : 'blockedInput'}`}
                                    type="text"
                                    disabled={editIndex !== index}
                                    value={editIndex === index ? editedName : iface.nome}
                                    onChange={(e) => setEditedName(e.target.value)} // Atualiza o nome enquanto edita
                                />
                                <div className="divDosBotoes">
                                    <button
                                        className={`btn-excluir ${editIndex === index ? 'off' : ''}`}
                                        onClick={() => handleDeleteClick(index)}
                                        disabled={isSaving}
                                        title="Excluir" // Tooltip adicionado aqui
                                    >
                                        <FaTrash />
                                    </button>
                                    <button
                                        className={`btn-editar ${editIndex === index ? 'off' : ''}`}
                                        onClick={() => handleEditClick(index)}
                                        disabled={isSaving}
                                        title="Editar" // Tooltip adicionado aqui
                                    >
                                        <BsPencilFill />
                                    </button>
                                    <button
                                        className={`btn-cancelar ${editIndex === index ? '' : 'off'}`}
                                        onClick={handleCancelClick}
                                        disabled={isSaving}
                                        title="Cancelar" // Tooltip adicionado aqui
                                    >
                                        <FaArrowRotateLeft />
                                    </button>
                                    <button
                                        className={`btn-salvar ${editIndex === index ? '' : 'off'}`}
                                        onClick={() => handleSaveClick(index)}
                                        disabled={isSaving}
                                        title="Salvar" // Tooltip adicionado aqui
                                    >
                                        <FaCheck />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )
            )}
            <div className="EditableInterfaces">
    <input
        className={`editableText bigInput ${!isFetchSuccessful ? 'off' : ''}`} // Adiciona a classe 'off' se a requisição não for bem-sucedida
        type="text"
        placeholder="Nome da interface"
        value={newInterface}
        onChange={(e) => setNewInterface(e.target.value)} // Atualiza o valor da nova interface
        disabled={!isFetchSuccessful} // Desativa o input se a requisição não for bem-sucedida
    />
    <div className={`divDosBotoes ${!isFetchSuccessful ? 'off' : ''}`}> {/* Adiciona a classe 'off' ao div dos botões */}
        <button
            className="btn-addInterface"
            onClick={handleAddClick}
            disabled={isSaving || !isFetchSuccessful}
            title="Adicionar Interface"
        >
            <FaPlus />
        </button>
    </div>
</div>
        </>
    );
    
}

export default EditableInterfaces;
