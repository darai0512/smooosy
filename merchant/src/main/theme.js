import { red, blue, grey, lightGreen } from '@material-ui/core/colors'

export const theme = {
  palette: {
    primary: {
      main: '#1180cc',
    },
    secondary: {
      main: '#8FC320',
      sub: '#448F43',
      subHover: '#549853',
      contrastText: '#ffffff',
    },
    red,
    blue: {
      ...blue,
      B200: '#1180CC',
      B400: '#004D99',
    },
    grey: {
      ...grey,
      G350: '#C4C4C4',
      G550: '#858585',
      G650: '#777777',
      G950: '#0D0D0D',
    },
    lightGreen: {
      ...lightGreen,
      G450: '#95C533',
      G550: '#8CC11F',
    },
  },
  'breakpoints': {
    'keys': [
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
    ],
    'values': {
      'xs': 0,
      'sm': 768,
      'md': 992,
      'lg': 1000000000,
      'xl': 1000000000,
    },
  },
  overrides: {
    MuiDialog: {
      paper: {
        minWidth: '50vw',
        overflowY: 'auto',
      },
      paperWidthSm: {
        margin: 16,
      },
    },
    MuiDialogTitle: {
      root: {
        padding: '24px 48px 20px 24px',
      },
    },
    MuiDialogContent: {
      root: {
        // for Safari rendering bug
        transform: 'translateZ(0)',
      },
    },
    MuiBadge: {
      badge: {
        top: -4,
        right: -4,
        height: 22,
        minWidth: 22,
        borderRadius: 11,
        transform: null,
      },
      colorPrimary: {
        backgroundColor: red[500],
      },
    },
    MuiCircularProgress: {
      colorPrimary: {
        color: '#8FC320',
      },
      colorSecondary: {
        color: '#fff',
      },
    },
    MuiListItem: {
      root: {
        paddingTop: 12,
        paddingBottom: 12,
      },
    },
    MuiButton: {
      root: {
        padding: '8px 16px', // same as v1
        minHeight: '36px', // same as v1
        textTransform: 'none',
      },
      text: {
        padding: null, // same as v1
      },
      outlined: {
        padding: '8px 16px', // same as v1
      },
      sizeSmall: {
        padding: '7px 8px',
      },
    },
    MuiIconButton: {
      root: {
        padding: 0, // same as v1
        width: 48, // same as v1
        height: 48, // same as v1
      },
    },
    MuiSwitch: {
      switchBase: {
        width: 'auto',
        height: 'auto',
      },
    },
  },
}

export default theme
