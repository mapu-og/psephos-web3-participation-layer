import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateSurvey } from './pages/CreateSurvey';
import { SurveyDetail } from './pages/SurveyDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'create', Component: CreateSurvey },
      { path: 'survey/:id', Component: SurveyDetail },
    ],
  },
]);
