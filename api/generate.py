from http.server import BaseHTTPRequestHandler
import urllib.parse
import sys
import os
import io

# Append the project root to sys.path so we can import modules from src/
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Set Matplotlib backend to non-interactive 'Agg' before importing pyplot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Import the core modules from visualize_tunnels.py
from src.visualize_tunnels import Config, Theme, TunnelNetwork, TunnelRenderer

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse request URL and query parameters
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Extract configuration parameters with defaults
            setback_val = 75.0
            if 'setback' in query_params:
                try:
                    setback_val = float(query_params['setback'][0])
                except ValueError:
                    pass
            
            is_dark = False
            if 'dark' in query_params:
                is_dark = query_params['dark'][0].lower() == 'true'
                
            img_format = 'svg'
            if 'format' in query_params:
                img_format = query_params['format'][0].lower()
                if img_format not in ['svg', 'png']:
                    img_format = 'svg'

            # Initialize the visualization config & theme
            config = Config()
            config.portal_setback = setback_val
            theme = Theme(is_dark=is_dark)
            
            # Generate the network graph
            network = TunnelNetwork(config)
            
            # Render using the Matplotlib renderer
            renderer = TunnelRenderer(network, config, theme)
            
            # Perform drawing logic to an in-memory buffer
            plt.style.use('default')
            fig, ax = plt.subplots(figsize=config.figsize, dpi=config.dpi)
            fig.patch.set_facecolor(theme.bg)
            ax.set_facecolor(theme.bg)
            
            # Setup grid
            ax.grid(color=theme.grid, linestyle='--', linewidth=0.5, zorder=0)
            
            # Boundaries matching coordinate limits
            limit = config.intersection_size / 2.0 + config.portal_setback + 50.0
            ax.set_xlim(-limit, limit)
            ax.set_ylim(-limit, limit)
            ax.set_aspect('equal')
            
            # Call internal draw functions on matplotlib axes in z-order
            renderer._draw_surface_roads(ax)
            renderer._draw_tunnel_troughs(ax)
            renderer._draw_tunnels(ax)
            renderer._draw_portals(ax)
            renderer._draw_nodes(ax)
            renderer._draw_measurements(ax)
            renderer._draw_cars(ax)
            renderer._draw_decorations(ax)
            
            plt.subplots_adjust(left=0.02, right=0.98, top=0.98, bottom=0.02)
            
            # Save drawing to bytes buffer
            buf = io.BytesIO()
            if img_format == 'png':
                plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', dpi=config.dpi)
                content_type = 'image/png'
            else:
                plt.savefig(buf, format='svg', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
                content_type = 'image/svg+xml'
            
            plt.close(fig)
            buf.seek(0)
            img_data = buf.getvalue()
            
            # Send HTTP response headers
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(img_data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'public, max-age=60')
            self.end_headers()
            
            # Write bytes to output stream
            self.wfile.write(img_data)
            
        except Exception as e:
            # Handle server errors and return a plain text error
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Internal Server Error: {str(e)}".encode('utf-8'))
