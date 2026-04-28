import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
  VStack,
  Icon,
  Spinner,
  Badge,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import {
  FaSearch,
  FaImages,
  FaWallet,
  FaSatellite,
  FaTerminal,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaChartLine,
  FaBolt,
  FaShieldAlt
} from 'react-icons/fa';

import metamaskIcon from './assets/metamask.svg';
import phantomIcon from './assets/phantom.svg';
import coinbaseIcon from './assets/coinbase.svg';
import mapuAvatar from './assets/mapu.jpg';
import ghettoLogo from './assets/ghetto_logo.png';

const config = {
  apiKey: 'IQIl0sgTcl8V4cLBUmdFe',
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(config);

const TRIAL_ADDRESS = '0x21E71CD023e4c3C1d55a997572a05a7adaE57a37';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [floorPrices, setFloorPrices] = useState({});

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const getNFTsForOwner = async (address) => {
    const target = address || userAddress;
    if (!target) return;
    setLoading(true);
    setHasQueried(false);
    try {
      const data = await alchemy.nft.getNftsForOwner(target);
      setResults(data);
      setHasQueried(true);

      const collections = [...new Set(data.ownedNfts.slice(0, 8).map(n => n.contract.address))];
      const prices = {};

      await Promise.all(collections.map(async (addr) => {
        try {
          const fp = await alchemy.nft.getFloorPrice(addr);
          if (fp.openSea?.floorPrice) {
            prices[addr] = fp.openSea.floorPrice;
          }
        } catch (err) {
          console.warn(`Floor price fail for ${addr}`);
        }
      }));
      setFloorPrices(prices);

    } catch (e) {
      console.error(e);
      alert('Error fetching NFTs. Check your address.');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const eth = window.ethereum;
      if (!eth) throw new Error("No crypto wallet found");

      const provider = new ethers.providers.Web3Provider(eth);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const message = `Wall NFsTreet ACCESS\nIdentity verification for ${address}\nTimestamp: ${Date.now()}`;
      await signer.signMessage(message);

      const bal = await provider.getBalance(address);

      setAccount(address);
      setSigner(signer);
      setBalance(ethers.utils.formatEther(bal).slice(0, 6));
      onClose();

      setUserAddress(address);
      getNFTsForOwner(address);

    } catch (e) {
      console.error(e);
      alert("Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    setAccount(null);
    setSigner(null);
    setBalance(null);
    setUserAddress('');
    setResults([]);
    setHasQueried(false);
  };

  return (
    <Box className="app-container" minH="100vh" w="100%" pb={20}>
      {/* Theme Toggle */}
      <IconButton
        position="fixed"
        bottom={8}
        right={8}
        icon={colorMode === 'dark' ? <FaSun /> : <FaMoon />}
        onClick={toggleColorMode}
        borderRadius="12px"
        size="lg"
        colorScheme="cyan"
        boxShadow="0 4px 15px rgba(6, 182, 212, 0.4)"
        zIndex={100}
        aria-label="Toggle Color Mode"
      />

      {/* Navigation */}
      <nav className="nav">
        <Flex align="center" gap={6}>
          <Image
            src={ghettoLogo}
            w="75px"
            h="75px"
            borderRadius="full"
            border="3px solid var(--neon-cyan)"
            boxShadow="0 0 25px rgba(6, 182, 212, 0.4)"
          />
          <VStack align="flex-start" spacing={0}>
            <Text className="logo" m={0} style={{ textTransform: 'none' }}>Wall NFsTreet</Text>
            <Text fontSize="10px" fontWeight="800" color="var(--mapu-pink)" letterSpacing="3px">GLOBAL ASSET TERMINAL // 2.0</Text>
          </VStack>
        </Flex>

        {!account ? (
          <Button
            className="action-btn"
            maxW="220px"
            h="48px"
            p="0 25px"
            fontSize="14px"
            onClick={onOpen}
          >
            Connect
          </Button>
        ) : (
          <Flex className="profile-pill" onClick={logout} cursor="pointer">
            <Image
              src={mapuAvatar}
              className="identicon-mapu"
            />
            <VStack align="flex-start" spacing={0} mr={4}>
              <Text fontSize="13px" fontWeight="800">{truncateAddress(account)}</Text>
              <Text fontSize="11px" fontWeight="800" color="var(--neon-green)">{balance} ETH</Text>
            </VStack>
            <Icon as={FaSignOutAlt} color="gray.500" fontSize="14px" />
          </Flex>
        )}
      </nav>

      <Box className="main-content" px={{ base: 4, md: 0 }}>
        {/* Left Column: Asset Terminal */}
        <Box className="card">
          <Heading as="h1">
            <Icon as={FaChartLine} color="var(--neon-cyan)" />
            ASSET TERMINAL
          </Heading>

          <Box className="input-wrapper">
            <Flex className="label-row">
              <label>REGISTRY ADDRESS / ENS</label>
            </Flex>
            <Flex className="input-container">
              <input
                type="text"
                placeholder="0x... or name.eth"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
              />
            </Flex>
            <Button
              variant="link"
              color="gray.500"
              fontSize="11px"
              mt={4}
              _hover={{ color: 'var(--neon-cyan)' }}
              onClick={() => { setUserAddress(TRIAL_ADDRESS); getNFTsForOwner(TRIAL_ADDRESS); }}
              textTransform="uppercase"
              letterSpacing="2px"
              fontWeight="700"
            >
              SIMULATE TRIAL: {truncateAddress(TRIAL_ADDRESS)}
            </Button>
          </Box>

          <Button
            className="action-btn"
            onClick={() => getNFTsForOwner()}
            isLoading={loading}
            leftIcon={<Icon as={FaBolt} />}
          >
            EXECUTE SCAN
          </Button>
        </Box>

        {/* Right Column: Global Intel */}
        <Box className="card">
          <Heading as="h1">
            <Icon as={FaTerminal} color="var(--mapu-pink)" />
            GLOBAL INTEL
          </Heading>

          <VStack align="flex-start" spacing={5} mt={4}>
            <Flex w="full" justify="space-between" align="center" borderBottom="1px solid var(--glass-border)" pb={4}>
              <Text fontSize="12px" fontWeight="800" color="var(--label-text)" textTransform="uppercase">NODE STATUS</Text>
              <Badge colorScheme={hasQueried ? "green" : "yellow"} variant="outline" px={3} py={0.5} borderRadius="4px" fontWeight="800">
                {loading ? "SEARCHING..." : hasQueried ? "ONLINE" : "STANDBY"}
              </Badge>
            </Flex>

            <Flex w="full" justify="space-between" align="center" borderBottom="1px solid var(--glass-border)" pb={4}>
              <Text fontSize="12px" fontWeight="800" color="var(--label-text)" textTransform="uppercase">ASSETS INDEXED</Text>
              <Text fontSize="16px" fontWeight="800">{hasQueried ? results.ownedNfts?.length : '---'}</Text>
            </Flex>

            <Flex w="full" justify="space-between" align="center" borderBottom="1px solid var(--glass-border)" pb={4}>
              <Text fontSize="12px" fontWeight="800" color="var(--label-text)" textTransform="uppercase">EXTRACT NETWORK</Text>
              <Text fontSize="12px" fontWeight="800" color="var(--mapu-pink)">SEPOLIA HUB</Text>
            </Flex>

            {loading ? (
              <Center w="full" py={4}>
                <Spinner size="md" color="var(--neon-cyan)" thickness="3px" />
              </Center>
            ) : !hasQueried ? (
              <Text fontSize="13px" color="gray.500" fontStyle="italic" fontWeight="600">
                Waiting for target address to begin indexing...
              </Text>
            ) : (
              <Text fontSize="13px" color="var(--neon-green)" fontWeight="800" letterSpacing="1px">
                EXTRACTION SUCCESSFUL. RESULTS RENDERED BELOW.
              </Text>
            )}
          </VStack>
        </Box>

        {/* Full-Width Registry Area */}
        <Box className="card" style={{ gridColumn: '1 / -1' }}>
          <Heading as="h1">
            <Icon as={FaImages} color="var(--neon-cyan)" />
            IDENTIFIED ASSET REGISTRY
          </Heading>

          {!hasQueried && !loading && (
            <Center h="250px" border="1px dashed var(--glass-border)" borderRadius="12px" mt={4}>
              <VStack opacity={0.3} spacing={3}>
                <Icon as={FaSatellite} boxSize={8} />
                <Text fontSize="xs" fontWeight="800" letterSpacing="4px" textTransform="uppercase">WAITING FOR INTEL</Text>
              </VStack>
            </Center>
          )}

          {hasQueried && !loading && (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={8} mt={8}>
              {results.ownedNfts?.map((nft, i) => (
                <VStack
                  key={nft.contract.address + nft.tokenId + i}
                  bg="rgba(0,0,0,0.4)"
                  borderRadius="12px"
                  p={4}
                  border="1px solid var(--glass-border)"
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ transform: 'translateY(-6px)', borderColor: 'var(--mapu-pink)', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' }}
                  align="stretch"
                >
                  <Box position="relative" h="190px" w="full" overflow="hidden" borderRadius="8px">
                    <Image
                      src={nft.image.cachedUrl || nft.image.thumbnailUrl || 'https://via.placeholder.com/200'}
                      alt={nft.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                      fallback={<Center h="full" bg="rgba(255,255,255,0.05)"><Icon as={FaImages} boxSize={8} opacity={0.1} /></Center>}
                    />
                    {floorPrices[nft.contract.address] && (
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="cyan"
                        bg="rgba(7, 9, 15, 0.9)"
                        variant="solid"
                        fontSize="9px"
                        p="4px 10px"
                        borderRadius="4px"
                        fontWeight="900"
                        border="1px solid var(--neon-cyan)"
                      >
                        FLOOR: {floorPrices[nft.contract.address]} ETH
                      </Badge>
                    )}
                  </Box>
                  <VStack align="flex-start" spacing={1} p={1} mt={3}>
                    <Text fontSize="9px" fontWeight="900" color="var(--mapu-pink)" letterSpacing="2px" textTransform="uppercase" noOfLines={1}>
                      {nft.contract.name || 'ASSET MODULE'}
                    </Text>
                    <Text fontSize="14px" fontWeight="800" noOfLines={1}>
                      {nft.name || `ASSET #${nft.tokenId.slice(0, 6)}`}
                    </Text>
                  </VStack>
                </VStack>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      {/* Wallet Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(20px)" bg="rgba(7, 9, 15, 0.95)" />
        <ModalContent className="modal-content">
          <ModalCloseButton color="gray.500" _hover={{ color: 'var(--mapu-pink)' }} />
          <ModalBody p={12}>
            {isConnecting ? (
              <VStack spacing={8} py={10}>
                <Heading size="md" letterSpacing="3px">NODE HANDSHAKE...</Heading>
                <Spinner size="xl" color="var(--neon-cyan)" thickness="4px" />
                <Text color="gray.500" textAlign="center" fontSize="sm" fontWeight="700">AWAITING BIOMETRIC SIGNATURE IN WALLET...</Text>
              </VStack>
            ) : (
              <VStack spacing={10}>
                <VStack spacing={4}>
                  <Box
                    p={5}
                    border="2px solid var(--neon-cyan)"
                    borderRadius="12px"
                    boxShadow="0 0 30px rgba(6, 182, 212, 0.2)"
                  >
                    <Icon as={FaShieldAlt} boxSize={10} color="var(--neon-cyan)" />
                  </Box>
                  <Heading size="lg" letterSpacing="4px">SECURITY GATEWAY</Heading>
                  <Text color="gray.500" fontSize="sm" fontWeight="700">SELECT AUTHENTICATION PROVIDER</Text>
                </VStack>

                <VStack w="full" spacing={4}>
                  <Flex className="provider-item" w="full" onClick={connectWallet} cursor="pointer" align="center">
                    <Image src={metamaskIcon} w="32px" mr={4} />
                    <Text fontWeight="800">METAMASK</Text>
                  </Flex>
                  <Flex className="provider-item" w="full" onClick={connectWallet} cursor="pointer" align="center">
                    <Image src={phantomIcon} w="32px" mr={4} />
                    <Text fontWeight="800">PHANTOM</Text>
                  </Flex>
                  <Flex className="provider-item" w="full" onClick={connectWallet} cursor="pointer" align="center">
                    <Image src={coinbaseIcon} w="32px" mr={4} />
                    <Text fontWeight="800">COINBASE</Text>
                  </Flex>
                </VStack>
                <Text fontSize="10px" color="gray.700" textTransform="uppercase" letterSpacing="4px" fontWeight="900">GLOBAL REBELLION STATUS // ENCRYPTED</Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <footer className="footer">
        <Box
          className="footer-content"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={3}
          transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{ transform: 'translateY(-10px)' }}
          cursor="pointer"
        >
          <Text fontSize="10px" color="gray.600" letterSpacing="6px" fontWeight="800">Wall NFsTreet // OPERATIONS ACTIVE</Text>
          <Text fontSize="16px" fontWeight="800" transition="all 0.3s">
            AUTHORIZED BY <span className="footer-name" style={{ transition: 'all 0.3s' }}>MapuriteLabs</span>
          </Text>
        </Box>
      </footer>
    </Box>
  );
}

export default App;
