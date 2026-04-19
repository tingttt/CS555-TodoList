import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <section className="hero">
        <h1>Stay on Top of Your Tasks</h1>
        <p>A simple, beautiful todo app to help you and your team get things done.</p>
        <div className="hero-btns">
          {user ? (
            <Link to="/task" className="btn-primary-hero">Go to My Tasks</Link>
          ) : (
            <>
              <Link to="/signup" className="btn-primary-hero">Get Started Free</Link>
              <Link to="/signin" className="btn-outline-hero">Sign In</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
