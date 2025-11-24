import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppInitializer } from './components/AppInitializer';

function App() {
  return (
    <AppInitializer>
      <RouterProvider router={router} />
    </AppInitializer>
  );
}

export default App;
