import { extendTheme } from '@chakra-ui/react';

const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    fonts: {
        heading: `'Outfit', sans-serif`,
        body: `'Outfit', sans-serif`,
    },
    styles: {
        global: (props) => ({
            body: {
                bg: 'transparent',
                color: props.colorMode === 'dark' ? 'white' : 'gray.800',
            },
        }),
    },
});

export default theme;
