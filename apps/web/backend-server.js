require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      'http://localhost:3000'
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.post('/api/notion/card', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description || !priority) {
      return res.status(400).json({
        error: 'Title, description, and priority are required fields',
      });
    }

    if (!['Baixa', 'Média', 'Alta'].includes(priority)) {
      return res.status(400).json({
        error: 'Priority must be one of: Baixa, Média, Alta',
      });
    }

    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token) {
      return res.status(500).json({
        error: 'NOTION_TOKEN environment variable is required',
      });
    }

    if (!databaseId) {
      return res.status(500).json({
        error: 'NOTION_DATABASE_ID environment variable is required',
      });
    }

    const requestBody = {
      parent: {
        database_id: databaseId,
      },
      properties: {
        Título: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        Descrição: {
          rich_text: [
            {
              text: {
                content: description,
              },
            },
          ],
        },
        Prioridade: {
          select: {
            name: priority,
          },
        },
        Criação: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Notion API Error Response:', errorData);

      if (response.status === 404) {
        return res.status(404).json({
          error: 'Database not found.',
        });
      }

      if (response.status === 401) {
        return res.status(401).json({
          error: 'Token not found.',
        });
      }

      if (response.status === 400) {
        return res.status(400).json({
          error: `${errorData.message}`,
        });
      }

      return res.status(response.status).json({
        error:`HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const responseData = await response.json();

    return res.status(201).json({
      id: responseData.id,
      url: pageUrl,
      created_time: responseData.created_time || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating Notion card:', error);
    return res.status(500).json({
      error: 'Failed to create Notion card',
    });
  }
});

app.listen(PORT, () => {
  console.log(`port ${PORT}`);
});
