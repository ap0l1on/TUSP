import { h, render } from 'preact';
import { App } from './App';
import './styles.css';

const el = document.getElementById('app');
if (el) render(<App />, el);
