import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEthereum, FaSearch, FaWallet } from 'react-icons/fa';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionButton = motion(Button);

const config = {
  apiKey: 'IQIl0sgTcl8V4cLBUmdFe',
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(config);
const metadataCache = {};

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getTokenBalance() {
    if (!userAddress) return;
    setIsLoading(true);
    setError(null);
    setHasQueried(false);

    try {
      const data = await alchemy.core.getTokenBalances(userAddress);

      const tokenDataPromises = [];

      for (let i = 0; i < data.tokenBalances.length; i++) {
        const address = data.tokenBalances[i].contractAddress;

        if (metadataCache[address]) {
          tokenDataPromises.push(Promise.resolve(metadataCache[address]));
        } else {
          const tokenData = alchemy.core.getTokenMetadata(address).then(meta => {
            metadataCache[address] = meta;
            return meta;
          });
          tokenDataPromises.push(tokenData);
        }
      }

      const resolvedMetadata = await Promise.all(tokenDataPromises);
      setResults(data);
      setTokenDataObjects(resolvedMetadata);
      setHasQueried(true);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch balances. Ensure the address is correct.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box
      minH="100vh"
      w="100vw"
      bg="#020617"
      color="white"
      pb={24}
      fontFamily="'Inter', sans-serif"
      overflowX="hidden"
      position="relative"
    >
      {/* Super Futuristic Background Elements */}
      <Box position="fixed" top={0} left={0} w="full" h="full" zIndex={0} pointerEvents="none">
        <MotionBox
          position="absolute"
          top="-10%"
          left="-10%"
          w="600px"
          h="600px"
          bg="blue.900"
          borderRadius="full"
          filter="blur(120px)"
          opacity={0.12}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <MotionBox
          position="absolute"
          bottom="-10%"
          right="-10%"
          w="500px"
          h="500px"
          bg="purple.900"
          borderRadius="full"
          filter="blur(100px)"
          opacity={0.12}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <Box
          w="full"
          h="full"
          backgroundImage="radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)"
          backgroundSize="25px 25px"
          opacity={0.3}
        />
      </Box>

      {/* Decorative HUD Elements */}
      <Box position="absolute" top={6} right={8} opacity={0.3} pointerEvents="none" zIndex={1}>
        <VStack spacing={1} align="flex-end">
          <Box w="80px" h="1px" bg="blue.400" />
          <Box w="40px" h="1px" bg="blue.400" />
          <Text fontSize="8px" fontFamily="monospace" letterSpacing="1px">SYS.ACTIVE_V4.2</Text>
        </VStack>
      </Box>

      {/* Main Content Container */}
      <Box position="relative" zIndex={1}>
        {/* Header Section */}
        <Center py={{ base: 16, md: 20 }}>
          <VStack spacing={4} textAlign="center" px={6}>
            <MotionBox
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge
                px={3}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
                letterSpacing="widest"
                fontSize="2xs"
                mb={3}
                bg="blue.900"
                color="blue.300"
                border="1px solid"
                borderColor="blue.700"
              >
                Alchemy Protocol Node
              </Badge>
              <Heading
                fontSize={{ base: '4xl', md: '7xl' }}
                fontWeight="900"
                bgGradient="linear(to-r, blue.400, white, purple.400)"
                bgClip="text"
                letterSpacing="tightest"
                lineHeight="0.9"
                textShadow="0 0 25px rgba(66, 153, 225, 0.3)"
              >
                TOKEN<br />INDEXER
              </Heading>
              <Text fontSize="md" color="gray.500" mt={6} maxW="600px" fontWeight="normal" letterSpacing="wide">
                Streaming real-time blockchain telemetry. Visualize your
                digital portfolio with institutional-grade fidelity.
              </Text>
            </MotionBox>
          </VStack>
        </Center>

        <Flex
          w="100%"
          flexDirection="column"
          alignItems="center"
          px={6}
        >
          {/* Search Card */}
          <MotionBox
            w="full"
            maxW="720px"
            p={{ base: 6, md: 10 }}
            borderRadius="3xl"
            bg="whiteAlpha.10"
            backdropFilter="blur(30px)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            boxShadow="0 0 80px -20px rgba(0, 0, 0, 0.8)"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            position="relative"
            overflow="hidden"
          >
            <Box position="absolute" top={0} left={0} w="full" h="1px" bgGradient="linear(to-r, transparent, blue.400, purple.400, transparent)" />

            <Flex direction="column" gap={6}>
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <Box w={1.5} h={1.5} bg="blue.400" borderRadius="full" boxShadow="0 0 8px #4299E1" />
                  <Text fontSize="xs" fontWeight="black" color="gray.400" letterSpacing="2px" textTransform="uppercase">
                    Target Identification
                  </Text>
                </Flex>
                <Text fontSize="9px" color="whiteAlpha.200" fontFamily="monospace">LINK_ESTABLISHED</Text>
              </Flex>
              <Input
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x... [ENTER WALLET ADDRESS]"
                _placeholder={{ color: 'whiteAlpha.200' }}
                color="white"
                variant="unstyled"
                bg="blackAlpha.400"
                _hover={{ bg: 'blackAlpha.500' }}
                _focus={{ bg: 'blackAlpha.600', border: '1px solid', borderColor: 'blue.500' }}
                h="70px"
                px={8}
                fontSize="xl"
                borderRadius="xl"
                transition="all 0.4s"
                fontFamily="monospace"
              />
              <MotionButton
                w="full"
                h="65px"
                fontSize="lg"
                onClick={getTokenBalance}
                colorScheme="blue"
                isLoading={isLoading}
                loadingText="RELAYING COMMAND..."
                borderRadius="xl"
                bgGradient="linear(to-r, blue.600, purple.600)"
                boxShadow="0 10px 20px -5px rgba(66, 153, 225, 0.4)"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                rightIcon={<Icon as={FaSearch} />}
                fontWeight="black"
                letterSpacing="2px"
                textTransform="uppercase"
              >
                INITIATE SCAN
              </MotionButton>
            </Flex>

            <AnimatePresence>
              {error && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  mt={4}
                >
                  <Text color="red.400" textAlign="center" fontWeight="bold" fontSize="sm" fontFamily="monospace">
                    [ERR]: {error}
                  </Text>
                </MotionBox>
              )}
            </AnimatePresence>
          </MotionBox>

          {/* Results Section */}
          <Box w="full" maxW="1300px" mt={20}>
            <Flex align="center" justify="space-between" mb={10} borderBottom="1px solid" borderColor="whiteAlpha.100" pb={6}>
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="9px" fontWeight="black" color="blue.500" letterSpacing="3px" textTransform="uppercase">
                  Live Feed Output
                </Text>
                <Heading size="md" fontWeight="800" letterSpacing="tighter">
                  {hasQueried ? 'VERIFICATION_SUCCESS' : 'SCANNER_READY'}
                </Heading>
              </VStack>
              {hasQueried && (
                <Badge colorScheme="green" variant="outline" fontSize="xs" px={3} py={1} borderRadius="lg">
                  {results.tokenBalances.length} NODES IDENTIFIED
                </Badge>
              )}
            </Flex>

            {hasQueried ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {results.tokenBalances.map((e, i) => {
                  const balance = parseFloat(Utils.formatUnits(
                    e.tokenBalance,
                    tokenDataObjects[i].decimals || 18
                  ));

                  if (balance === 0) return null;

                  return (
                    <MotionFlex
                      key={e.contractAddress}
                      flexDir={'column'}
                      bg="whiteAlpha.50"
                      backdropFilter="blur(15px)"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                      borderRadius="2xl"
                      p={8}
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      whileHover={{
                        y: -8,
                        bg: 'whiteAlpha.100',
                        borderColor: 'blue.400',
                        boxShadow: '0 20px 40px -20px rgba(0, 0, 0, 0.7)'
                      }}
                    >
                      <Flex justifyContent="space-between" alignItems="flex-start" mb={6}>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="8px" fontWeight="black" color="blue.500" textTransform="uppercase" letterSpacing="2px" mb={1}>
                            Protocol Key
                          </Text>
                          <Text fontSize="xl" fontWeight="900" letterSpacing="tighter">
                            {tokenDataObjects[i].symbol || 'N/A'}
                          </Text>
                        </VStack>
                        <Image
                          src={tokenDataObjects[i].logo}
                          boxSize="40px"
                          borderRadius="lg"
                          fallback={<Center boxSize="40px" bg="blackAlpha.600" borderRadius="lg"><Icon as={FaEthereum} w={5} h={5} /></Center>}
                          p={1.5}
                          bg="whiteAlpha.200"
                          border="1px solid"
                          borderColor="whiteAlpha.200"
                        />
                      </Flex>
                      <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={4}>
                        <Text fontSize="8px" fontWeight="black" color="gray.500" textTransform="uppercase" letterSpacing="2px" mb={2}>
                          Holding Metrics
                        </Text>
                        <Text fontSize="2xl" fontWeight="300" letterSpacing="tighter" color="blue.50" lineHeight="1.1">
                          {balance > 0.0001 ? balance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : balance}
                        </Text>
                      </Box>
                    </MotionFlex>
                  );
                })}
              </SimpleGrid>
            ) : isLoading ? (
              <Center h="300px" flexDir="column" gap={6}>
                <MotionBox
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                    scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                  }}
                >
                  <Icon as={FaEthereum} w={12} h={12} color="blue.400" filter="drop-shadow(0 0 10px #4299E1)" />
                </MotionBox>
                <Text fontSize="xl" fontWeight="black" letterSpacing="3px" textTransform="uppercase" color="blue.400">
                  Parsing Blockchain Hub...
                </Text>
              </Center>
            ) : (
              <Center h="250px" border="1px dashed" borderColor="whiteAlpha.100" borderRadius="3xl" bg="whiteAlpha.5">
                <VStack spacing={4}>
                  <Icon as={FaSearch} w={8} h={8} color="whiteAlpha.200" />
                  <Text color="whiteAlpha.300" fontSize="lg" fontWeight="light" letterSpacing="widest" textTransform="uppercase">
                    System Idle: Awaiting Input
                  </Text>
                </VStack>
              </Center>
            )}
          </Box>
        </Flex>

        {/* Footer / Branding */}
        <Box
          as="footer"
          w="full"
          py={16}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          mt={32}
        >
          <VStack spacing={4}>
            <Flex align="center" gap={3} opacity={0.4}>
              <Box w="30px" h="1px" bg="whiteAlpha.400" />
              <Text fontSize="2xs" color="gray.500" fontWeight="black" letterSpacing="4px" textTransform="uppercase">
                Future Interface v6.0
              </Text>
              <Box w="30px" h="1px" bg="whiteAlpha.400" />
            </Flex>
            <Flex align="center" gap={3}>
              <Text fontSize="md" fontWeight="light" color="gray.500">
                Developed by
              </Text>
              <MotionBox whileHover={{ scale: 1.05 }}>
                <Text
                  fontSize="2xl"
                  fontWeight="900"
                  bgGradient="linear(to-r, blue.400, cyan.300, purple.500)"
                  bgClip="text"
                  letterSpacing="tightest"
                >
                  MapuriteLabs 💎
                </Text>
              </MotionBox>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
