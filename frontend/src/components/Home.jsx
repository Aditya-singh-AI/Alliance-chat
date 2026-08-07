import React from 'react';
import Layout from './Layout';
import ChatList from '../pages/chat-section/ChatList';

// Home wraps the ChatList inside the Layout shell
const Home = () => {
  return (
    <Layout>
      <ChatList />
    </Layout>
  );
};

export default Home;
